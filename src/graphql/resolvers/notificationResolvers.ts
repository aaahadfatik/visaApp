import { Notification } from '../../entity';
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';
import { NotificationFilter } from '../../types';

const notificationRepository = dataSource.getRepository(Notification);

const notificationResolvers = {
    Query: {
      getNotifications: async (_: any, { userId }: { userId: string }, context: any) => {
        await authenticate(context);
        const [notifications, total] = await notificationRepository.findAndCount({
          where: { user: { id: userId } },
          relations: ['user'],
          order: { createdAt: 'DESC' },
        });
        return {notifications,total}
      },

      getAdminNotifications: async (_: any, { filter }: { filter: NotificationFilter }, context: any) => {
        await authenticate(context);
        const query = notificationRepository
          .createQueryBuilder("notification")
          .leftJoinAndSelect("notification.user", "user")
          .orderBy("notification.createdAt", "DESC");
      
        // 🔍 Search filter
        if (filter?.search) {
          query.andWhere(
            `(notification.message ILIKE :search 
              OR user.name ILIKE :search 
              OR user.email ILIKE :search)`,
            { search: `%${filter.search}%` }
          );
        }
      
        // ✅ Read / Unread filter
        if (typeof filter?.isRead === "boolean") {
          query.andWhere("notification.isRead = :isRead", {
            isRead: filter.isRead,
          });
        }
      
        // 📅 Date range filter
        if (filter?.startDate && filter?.endDate) {
          query.andWhere("notification.createdAt BETWEEN :start AND :end", {
            start: new Date(filter.startDate),
            end: new Date(filter.endDate),
          });
        } else if (filter?.startDate) {
          query.andWhere("notification.createdAt >= :start", {
            start: new Date(filter.startDate),
          });
        } else if (filter?.endDate) {
          query.andWhere("notification.createdAt <= :end", {
            end: new Date(filter.endDate),
          });
        }
      
        const [notifications, total] = await query.getManyAndCount();

        return {
          notifications,
          total,
        };
      },
  
      getNotification: async (_: any, { id }: { id: string }, context: any) => {
        await authenticate(context);
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
        const notification = await notificationRepository.findOne({ where: { id } });
  
        if (!notification) {
          throw new Error('Notification not found');
        }
  
        notification.isRead = true;
        await notificationRepository.save(notification);
        return notification;
      },
      markAllNotificationsASRead: async (_: any, { userId }: { userId: string }, context: any) =>{
        const notifications = await notificationRepository.find({
          where: {
            user: { id: userId },
            isRead: false,
          },
        });
      
        if (notifications.length === 0) {
          return true; // nothing to update
        }
      
        // ✅ Correct mutation
        notifications.forEach((notification) => {
          notification.isRead = true;
        });
      
        await notificationRepository.save(notifications);
        return true;
      }
    },
  };
  
  export default notificationResolvers;
  