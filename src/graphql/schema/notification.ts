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

type NotificationReturn {
  notifications: [Notification!]!
  total:Int
}

input NotificationFilter {
  search:String
  isRead:Boolean
  startDate: DateTime
  endDate:DateTime
}
type Query {
  getNotifications(userId: ID!): NotificationReturn!
  getNotification(id: ID!): Notification
  getAdminNotifications(filter: NotificationFilter): NotificationReturn!
}

type Mutation {
  # createNotification(userId: ID!, title: String!, message: String!): Notification!
  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsASRead(userId:ID):Boolean!
}
  `;

export default notification;