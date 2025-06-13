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
  emirate: String
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
}

input CreateRoleInput {
  name: String!
}

input UpdateRoleInput {
  id:String!
  name: String
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
}

input UpdateUserInput {
  id:String!
  name: String
  phone: String
  email: String!
  organizationName: String
  position: String
  password: String!
  emirate: String!
  isSalary: Boolean
  isExpirence: Boolean
  isActive: Boolean
  isCompany: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  roleId: ID
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


type Query {
  getRoles: [Role!]!

  getUser(id: ID!): User
  getUsers(limit: Int, offset: Int): [User!]!
}

type Mutation {
  createRole(input: CreateRoleInput!): Role!
  updateRole(input: UpdateRoleInput!): Role!

  login(email:String password: String!): LoginRes
  logout: LogoutResponse

  createUser(input: UserInput!): User!
  updateUser(input: UpdateUserInput!): User!

  generateClientAccountNumber: String
  refreshToken(token: String!): AuthResponse
}
`;

export default user;