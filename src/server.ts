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

export const pubsub = new PubSub();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
}

// Create an instance of ApolloServer
const app: any = express();
app.use(express.json({ limit: '10mb' })); // ⬅️ Increase to 10 MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static('public'))

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
                || req.body.query.includes('updateUser');

            const isIntrospectionQuery = req.body.query && req.body.query.includes('__schema');
            if (isIntrospectionQuery) {
                return {}; // Return an empty context for introspection queries
            }

            if (isPublic) {
                return { isPublic };
            }

            if (!token) {
                throw new Error('Token not found');
            }

            const mainToken = token?.substring(6, token.length);
            const { userId } = await verifyToken(mainToken);

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
            throw new Error(`Invalid token or authentication failed: ${err}`);
        }
    },
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
