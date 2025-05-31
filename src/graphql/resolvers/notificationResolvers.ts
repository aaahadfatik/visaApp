import { Notification,User } from '../../entity';
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';

const notificationResolvers = {
    Query: {
      getNotifications: async (_: any, { userId }: { userId: string }, context: any) => {
        await authenticate(context);
        const notificationRepository = dataSource.getRepository(Notification);
        return await notificationRepository.find({
          where: { user: { id: userId } },
          relations: ['user'],
          order: { createdAt: 'DESC' },
        });
      },
  
      getNotification: async (_: any, { id }: { id: string }, context: any) => {
        await authenticate(context);
        const notificationRepository = dataSource.getRepository(Notification);
        const notification = await notificationRepository.findOne({
          where: { id },
          relations: ['user'],
        });
  
        if (!notification) {
          throw new Error('Notification not found');
        }
  
        return notification;
      },
    },
  
    Mutation: {
      markNotificationAsRead: async (_: any, { id }: { id: string }, context: any) => {
        await authenticate(context);
        const notificationRepository = dataSource.getRepository(Notification);
        const notification = await notificationRepository.findOne({ where: { id } });
  
        if (!notification) {
          throw new Error('Notification not found');
        }
  
        notification.isRead = true;
        await notificationRepository.save(notification);
        return notification;
      },
    },
  };
  
  export default notificationResolvers;
  