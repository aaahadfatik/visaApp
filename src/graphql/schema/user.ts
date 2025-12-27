import { gql } from 'apollo-server';

const user = gql`
scalar DateTime

enum Gender {
  MALE
  FEMALE
  OTHER
}

type Role {
  id: ID!
  name: String!
}
  
type User {
  id: ID!
  name: String
  phone: String
  email: String!
  picture: String
  organizationName: String
  position: String
  password: String!
  isSalary: Boolean
  isExpirence: Boolean
  otp: Int!
  isActive: Boolean
  isCompany: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  roleId: ID
  role: Role!
  documents: [Document!]
  notifications: [Notification!]
  applications: [Application!]
  fcmToken: String
  createdAt: DateTime!
  submittedFromCount: Int!
}

input CreateRoleInput {
  name: String!
}

input UpdateRoleInput {
  id:String!
  name: String
}

type UserReturn {
  users: [User!]!
  total: Int
}

input UserInput {
  name: String
  phone: String!
  email: String!
  password: String!

  picture: String

  isCompany: Boolean
  organizationName: String
  position: String
  isSalary: Boolean
  isExpirence: Boolean
  isActive: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  documents: [CreateDocumentInput]
  fcmToken: String
}

input UpdateUserInput {
  id:String!
  name: String
  phone: String
  email: String
  organizationName: String
  position: String
  password: String
  isSalary: Boolean
  isExpirence: Boolean
  isActive: Boolean
  isCompany: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  picture: String
  refreshToken: String
  roleId: ID
  fcmToken: String
}


type LogoutResponse {
  message: String!
}

type LoginRes {
  token : String,
  user: User
}
    
type AuthPayload {
  token: String!
  refreshToken: String!
  user: User!
}

type AuthResponse {
  token: String!
}

input UserFilter {
  status: Boolean
  type: Boolean
  search: String
}

type UserTypeReturn {
  companyCount: Int!
  individualCount: Int!
}

type DashboardStatisticsReturn {
  totalUsers: Int!
  applicationsSubmitted: Int!
  pendingApplications: Int!
  todayApplications: Int!
}

type RegisteredUsersGraphItem {
  companyCount: Int!
  individualCount: Int!
}

type RegisteredUsersGraphReturn {
  year:String!
  data: [RegisteredUsersGraphItem!]!
}

type Query {
  getRoles: [Role!]!

  getUser(id: ID!): User
  getUsers(limit: Int, offset: Int, filter:UserFilter): UserReturn!
  getUserTypesCount: UserTypeReturn!
  getDashboardStatistics: DashboardStatisticsReturn!
  getRegisteredUsersGraph(year:String): RegisteredUsersGraphReturn!
}

type Mutation {
  createRole(input: CreateRoleInput!): Role!
  updateRole(input: UpdateRoleInput!): Role!

  login(email:String password: String!): LoginRes
  logout: LogoutResponse

  createUser(input: UserInput!): User!
  updateUser(input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  changePassword(oldPassword: String! newPassword: String!): Boolean!

  generateClientAccountNumber: String
  refreshToken(token: String!): AuthResponse
}
type Subscription {
  newNotification: Notification!
}
`;

export default user;