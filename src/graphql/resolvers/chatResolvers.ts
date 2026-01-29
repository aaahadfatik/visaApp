import { Chat, Message, User, Notification } from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { In } from "typeorm";
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

      return savedChat;
    },

    sendMessage: async (_: any, { chatId, content }: any, context: any) => {
      const ctxUser = await authenticate(context);
      const userRepo = dataSource.getRepository(User);
      const messageRepo = dataSource.getRepository(Message);
      const notificationRepository = dataSource.getRepository(Notification);
      const chat = await dataSource.getRepository(Chat).findOne({ 
        where:{id: chatId },
        relations: ["sender", "receiver"]
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

      // Create notification for receiver
      const notification = notificationRepository.create({
        name: "New Message",
        message: `You have a new message from ${sender.name}`,
        user: receiver,
      });
      const savedNotification = await notificationRepository.save(notification);

      // Publish to receiver's subscription (admin or regular user)
      pubsub.publish("NEW_NOTIFICATION", {
        newNotification: savedNotification,
      });

      // Notify all admins (super admin or admin) about the new message, akin to an agent inbox
      const admins = await userRepo.find({
        where: { role: { name: In(["super admin", "admin"]) } },
        relations: ["role"],
      });

      const notified = new Set<string>([receiver.id, sender.id]);

      for (const admin of admins) {
        // Avoid double notifying sender/receiver and duplicate admins
        if (notified.has(admin.id)) continue;
        notified.add(admin.id);

        const adminNotification = notificationRepository.create({
          name: "New Chat Message",
          message: `New message from ${sender.name} to ${receiver.name}`,
          user: admin,
        });
        const savedAdminNotification =
          await notificationRepository.save(adminNotification);

        pubsub.publish("NEW_NOTIFICATION", {
          newNotification: savedAdminNotification,
        });
      }

      return savedMessage;
    },
  },
};

export default chatResolvers;
