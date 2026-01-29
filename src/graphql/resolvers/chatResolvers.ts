import { Chat, Message,User,Notification } from '../../entity';
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';
import { In, IsNull, Not } from 'typeorm';
import { pubsub } from '../../server'; 

const chatResolvers = {
  Query: {
    getChatById: async (_: any, { id }: any, context: any) => {
      await authenticate(context);
      return dataSource.getRepository(Chat).findOne({
        where: { id },
        relations: ['sender', 'receiver', 'messages', 'messages.sender'],
      });
    },
    getUserChats: async (_: any, __: any, context: any) => {
      const user = await authenticate(context);
      return dataSource.getRepository(Chat).find({
        where: [
          { sender: { id: user.userId } },
          { receiver: { id: user.userId } },
        ],
        relations: ['sender', 'receiver', 'messages'],
        order: { updatedAt: 'DESC' },
      });
    },
  },

  Mutation: {
    createChat: async (_: any, { receiverId }: any, context: any) => {
      const ctxUser = await authenticate(context);
      const userRepo = dataSource.getRepository(User);
      const chatRepo = dataSource.getRepository(Chat);

      const receiver = await userRepo.findOne({ where:{id: receiverId} });
      const sender = await userRepo.findOne({ where: {id: ctxUser.userId} });

      if (!receiver)  throw new Error('Receiver not found');
      if (!sender)  throw new Error('Sender not found');

      const existing = await dataSource.getRepository(Chat).findOne({
        where: [
          { sender: { id: ctxUser.userId }, receiver: { id: receiver.id } },
          { sender: { id: receiver.id }, receiver: { id: ctxUser.userId } },
        ],
      });

      if (existing) return existing;
      const chat = new Chat();
      chat.sender = sender;
      chat.receiver = receiver;

      const savedChat:Chat = await chatRepo.save(chat);

      return savedChat;
    },

    sendMessage: async (_: any, { chatId, content }: any, context: any) => {
      const ctxUser = await authenticate(context);
      const userRepo = dataSource.getRepository(User);
      const messageRepo = dataSource.getRepository(Message);
      const notificationRepository = dataSource.getRepository(Notification);
      const chat = await dataSource.getRepository(Chat).findOne({ 
        where:{id: chatId },
        relations: ["sender", "receiver"],
      });
      if (!chat) throw new Error('Chat not found');

      const sender = await userRepo.findOne({ where:{id: ctxUser.userId} });
      if (!sender) throw new Error('Sender not found');

      let receiver;
      if (chat.sender.id === sender.id) {
        receiver = chat.receiver;
      } else if (chat.receiver.id === sender.id) {
        receiver = chat.sender;
      } else {
        throw new Error("You are not part of this chat");
      }

      const message = messageRepo.create({
        content,
        sender,
        chat,
      });

      const savedMessage = await messageRepo.save(message);
      
       // Create notification
       const notification = notificationRepository.create({
          name: 'New Message',
          message: `You have a new message from ${sender.name}`,
          user: receiver,
      });
      const savedNotification = await notificationRepository.save(notification);

        // Publish to subscriptions
      context.pubsub.publish('NEW_NOTIFICATION', { newNotification: savedNotification });


      return savedMessage;
    },
  },
};

export default chatResolvers;
