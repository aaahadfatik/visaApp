import { Chat, Message, User, Notification } from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { In, IsNull, Not } from "typeorm";
import { pubsub } from "../../server";

const chatResolvers = {
  Query: {
    getChatById: async (_: any, { id }: any, context: any) => {
      await authenticate(context);
      return dataSource.getRepository(Chat).findOne({
        where: { id },
        relations: ["sender", "receiver", "messages", "messages.sender"],
      });
    },
    getUserChats: async (_: any, __: any, context: any) => {
      const user = await authenticate(context);
      return dataSource.getRepository(Chat).find({
        where: [
          { sender: { id: user.userId } },
          { receiver: { id: user.userId } },
        ],
        relations: ["sender", "receiver", "messages"],
        order: { updatedAt: "DESC" },
      });
    },
  },

  Mutation: {
    createChat: async (_: any, { receiverId }: any, context: any) => {
      const ctxUser = await authenticate(context);
      const userRepo = dataSource.getRepository(User);
      const chatRepo = dataSource.getRepository(Chat);
      const notificationRepository = dataSource.getRepository(Notification);

      const receiver = await userRepo.findOne({ where: { id: receiverId } });
      const sender = await userRepo.findOne({ 
        where: { id: ctxUser.userId },
        relations: ["role"],
      });

      if (!receiver) throw new Error("Receiver not found");
      if (!sender) throw new Error("Sender not found");

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

      const savedChat: Chat = await chatRepo.save(chat);

      // Send notifications to all admins (super admin or admin)
      const admins = await userRepo.find({
        where: { role: { name: In(["super admin", "admin"]) } },
        relations: ["role"],
      });

      for (const admin of admins) {
        // Skip if admin is the sender or receiver
        if (admin.id === sender.id || admin.id === receiver.id) continue;

        const adminNotification = notificationRepository.create({
          name: "New Chat Created",
          message: `New chat created between ${sender.name} and ${receiver.name}`,
          user: admin,
        });
        const savedAdminNotification =
          await notificationRepository.save(adminNotification);

        // Publish to admin's subscription
        pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      return savedChat;
    },

    sendMessage: async (_: any, { chatId, content }: any, context: any) => {
      const ctxUser = await authenticate(context);
      const userRepo = dataSource.getRepository(User);
      const messageRepo = dataSource.getRepository(Message);
      const notificationRepository = dataSource.getRepository(Notification);
      const chat = await dataSource
        .getRepository(Chat)
        .findOne({ where: { id: chatId } });
      if (!chat) throw new Error("Chat not found");

      const sender = await userRepo.findOne({
        where: { id: ctxUser.userId },
        relations: ["role"],
      });
      const receiver = await userRepo.findOne({
        where: { id: chat.receiverId },
      });
      if (!sender) throw new Error("Sender not found");
      if (!receiver) throw new Error("Receiver not found");

      const message = new Message();
      message.content = content;
      message.sender = sender;
      message.chat = chat;

      const savedMessage = await messageRepo.save(message);

      // Create notification for receiver
      const notification = notificationRepository.create({
        name: "New Message",
        message: `You have a new message from ${sender.name}`,
        user: receiver,
      });
      const savedNotification = await notificationRepository.save(notification);

      // Publish to receiver's subscription
      pubsub.publish("NEW_NOTIFICATION", {
        newNotification: savedNotification,
      });

      // Send notifications to all admins (super admin or admin)
      const admins = await userRepo.find({
        where: { role: { name: In(["super admin", "admin"]) } },
        relations: ["role"],
      });

      for (const admin of admins) {
        // Skip if admin is the sender or receiver
        if (admin.id === sender.id || admin.id === receiver.id) continue;

        const adminNotification = notificationRepository.create({
          name: "New Chat Message",
          message: `New message from ${sender.name} to ${receiver.name}`,
          user: admin,
        });
        const savedAdminNotification =
          await notificationRepository.save(adminNotification);

        // Publish to admin's subscription
        pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      return savedMessage;
    },
  },
};

export default chatResolvers;
