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
  organizationName: String
  position: String
  phone: String!
  email: String!
  password: String!
  otp:Int
  isCompany: Boolean
  isActive: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  roleId: String
  role: Role
  documents: [Document]
  notifications: [Notification]
  applications: [Application]
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
  organizationName: String
  position: String
  phone: String
  email: String
  password: String
  otp:Int
  isCompany: Boolean
  isActive: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  roleId: String
  documents: [CreateDocumentInput]
}

input UpdateUserInput {
  id:String!
  name: String
  organizationName: String
  position: String
  phone: String
  email: String
  password: String
  otp:Int
  isCompany: Boolean
  isActive: Boolean
  isProfileCompleted: Boolean
  lastLoginDate: String
  refreshToken: String
  roleId: String
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

  login(accountnumber: Int!,email:String password: String!): LoginRes
  logout: LogoutResponse

  createUser(input: UserInput!): User!
  updateUser(input: UpdateUserInput!): User!

  generateClientAccountNumber: String
  refreshToken(token: String!): AuthResponse
}
`;

export default user;