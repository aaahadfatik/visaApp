import { DataSource } from 'typeorm';
import { 
  User,Role,Document,Notification,Chat,Message,Application,Service,Form,FormAttribute,Visa,Category,FormSubmission,Payment,CategoryAttribute
} from './entity';
import dotenv from 'dotenv';
dotenv.config();

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [ Role,User,Document,Notification,Chat,Message,Application,Service,Form,FormAttribute,Visa,Category,FormSubmission,Payment,CategoryAttribute],
  synchronize: true,
  logging: true,
});
