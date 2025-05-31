import { gql } from 'apollo-server';

const notification = gql`
type Notification {
  id: ID!
  name: String!
  message: String
  isRead: Boolean!
  createdAt: DateTime!
  user: User!
}

type Query {
  getNotifications(userId: ID!): [Notification!]!
  getNotification(id: ID!): Notification
}

type Mutation {
  # createNotification(userId: ID!, title: String!, message: String!): Notification!
  markNotificationAsRead(id: ID!): Notification!
}
  `;

export default notification;