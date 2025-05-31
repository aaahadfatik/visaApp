import { gql } from 'apollo-server-express';

const chat = gql`
  type Chat {
    id: ID!
    sender: User!
    receiver: User!
    messages: [Message!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    chat: Chat!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

   type Query {
    getChatById(id: ID!): Chat
    getUserChats: [Chat!]!
  }

   type Mutation {
    createChat(receiverId: ID!): Chat!
    sendMessage(chatId: ID!, content: String!): Message!
  }
`;

export default chat;
