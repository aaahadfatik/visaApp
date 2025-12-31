import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/typeDefs';
import * as resolvers from './graphql/resolvers';
import { dataSource } from './datasource'; // Import the correct dataSource
import { verifyToken } from './utils/authUtils';
import express from 'express';
import { User } from './entity';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema'; 
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import admin from './firebase';
import {logger} from './utils/logger'
import { createPaymentLink, getPaymentStatus } from './service/nomodService';
import paymentRedirectRoutes from './routes/paymentRedirect';

const userRepository = dataSource.getRepository(User);

export const pubsub = new PubSub();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
}

const app:any = express();
app.use(express.json());

const staticDir = 'public/static'; //local
// const staticDir = '/var/www/visaApp/public/static';
app.use('/static', express.static(staticDir));

if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

app.use(express.static('public'))

// Payment redirect routes (must be before Apollo middleware)
app.use(paymentRedirectRoutes);

const schema = makeExecutableSchema({ typeDefs, resolvers: Object.values(resolvers) });

const server = new ApolloServer({
    schema,
    introspection: true,
    context: async ({ req,res }) => {
        try {
            const token = req.headers.authorization || '';
            const isPublic =
                req.body.query.includes('login')
                || req.body.query.includes('createUser')
                || req.body.query.includes('getUser')
                || req.body.query.includes('updateUser')
                || req.body.query.includes('getServices')
                || req.body.query.includes('getCategories')
                || req.body.query.includes('getCategoryById')
                || req.body.query.includes('getVisas')
                || req.body.query.includes('getVisaById');

             const query = req.body?.query || req.query?.query || '';
            const isIntrospectionQuery = query.includes('__schema');
            if (isIntrospectionQuery) {
                return {}; // Return an empty context for introspection queries
            }

            if (isPublic) {
                return { isPublic };
            }

            if (!token) {
                throw new Error('Token not found');
            }

            logger.info(`🚀 token from headers:${req.headers.authorization}`);

            const mainToken = token.substring(7);
            logger.info(`🚀 mainToken:${mainToken}`);

            const { newToken, userId } = await verifyToken(mainToken);
            logger.info(`🚀 newToken:${newToken}`);
            logger.info(`🚀 userId:${userId}`);

            if (!userId) {
                throw new Error('Authentication failed');
            }
            
            const user = await dataSource.getRepository(User).findOne({
                where: { id: userId },
            });
            
            if (!user) {
                throw new Error('User not found');
            }

            if (mainToken) {
                res.setHeader('Authorization', `Bearer ${mainToken}`);
            }

            if (!user) throw new Error('Authentication failed');

            return { userId: user.id, role: user.role, mainToken,pubsub };
        } catch (err) {
          return {}
        }
    },
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, staticDir); // Save files in this directory
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname); // e.g. .jpg, .pdf
      cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
  
app.post('/upload', upload.single('file'), (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      // Construct the public file URL
      const fileUrl = `${req.protocol}://${req.get('host')}/static/${req.file.filename}`;
  
      // Optionally: Save file info to database here
  
      return res.status(200).json({
        message: 'File uploaded successfully',
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileUrl,
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }); 
  

app.post('/create-payment', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🟢 POST /create-payment - Request received');
    const { title, currency, items, note, success_url, failure_url, submittedFormId } = req.body;

    // Validate required fields
    if (!title || !currency || !items || !success_url || !failure_url) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'currency', 'items', 'success_url', 'failure_url'] 
      });
    }

    // Validate items have valid amounts
    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    for (const item of items) {
      const amount = parseFloat(item.amount);
      if (!item.amount || isNaN(amount) || amount <= 0) {
        console.error('❌ Invalid item amount:', item);
        return res.status(400).json({ 
          error: 'Invalid item amount. All items must have a non-zero amount.',
          invalidItem: item
        });
      }
    }

    const payment = await createPaymentLink({
      title,
      currency,
      items,
      note,
      success_url,
      failure_url,
      submittedFormId,
      discount_percentage: 0,
      shipping_address_required: false,
      allow_tip: false,
      allow_tabby: true,
      allow_tamara: true,
      allow_service_fee: true,
      payment_expiry_limit: 2,
    });

    console.log('✅ Payment link created successfully');
    res.json(payment);
  } catch (err: any) {
    console.error('❌ Error in /create-payment:', err);
    
    const errorResponse: any = { error: err.message };
    
    // Only include detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
      errorResponse.name = err.name;
    }
    
    res.status(500).json(errorResponse);
  }
});

app.get('/payment-status/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const status = await getPaymentStatus(id);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataSource.initialize().then(async() => {
    // Start Apollo Server
    await server.start();

    // Create HTTP server
    const httpServer = createServer(app);

    // Apply middleware
    server.applyMiddleware({ 
        app,
        cors: {
            credentials: true,
            origin: [
                'http://localhost:8080',
                'https://studio.apollographql.com',
                'http://localhost:3000', 
                'http://localhost:3001',
                'http://admin.alem.ae/'
            ],
        }
    });


    // Set up WebSocket for handling GraphQL subscriptions
    new SubscriptionServer({
        execute,
        subscribe,
        schema,
        onConnect: () => ({ pubsub }),
    },
    {
        server: httpServer,
        path: '/subscriptions', // WebSocket endpoint for subscriptions
    }
    );
    //for images
    app.listen(4007, () => {
        console.log(`🚀 Express Server ready at 4007`);
    });
    // fetchAndStoreData();
    httpServer.listen(4006, () => {
        console.log(`🚀 Server ready at http://localhost:4006${server.graphqlPath}`);
        console.log(`🚀 Subscriptions ready at ws://localhost:4006/subscriptions`);
    });
})
.catch(error => {
    console.error('Error initializing data source:', error);
});

export const sendNotification = async (fcmToken: string, title: string, body: string): Promise<void> => {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken, // target device FCM token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

app.post('/send-fcm', async (req: express.Request, res: express.Response) => {
  try {
    const { id, title, body } = req.body;

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.fcmToken) {
      return res.status(400).json({ success: false, error: 'User token is undefined' });
    }

    await sendNotification(user.fcmToken, title, body);
    res.status(200).json({ success: true, message: 'Notification sent.' });

  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : error });
  }
});
  
