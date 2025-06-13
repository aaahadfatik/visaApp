import { gql } from 'apollo-server';

const application = gql`
scalar DateTime

enum VisaType {
  EMIRATESID  
  TOURIST     
  RESIDENCE   
  MEDICALTEST  
  INSURANCE   
}

enum ApplicationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ApplicationType {
  NEW
  RENEWAL
  CANCELLATION
  MODIFICATION
}

type Application {
  id: ID!
  applicant: User!
  files: [Document!]!
  visaType: VisaType!
  sponsorName: String!
  sponsorNumber: String!
  whatsappNumber: String!
  emiratesId: String!
  emirate: String!
  uidNumber: String!
  address: String!
  comments: String
  accountNumber: String!
  applicationPriority: ApplicationPriority!
  applicationType: ApplicationType!
  createdAt: DateTime!

  service: Service
}

input CreateApplicationInput {
  applicantId: String!
  files: [CreateDocumentInput!]!
  visaType: VisaType!
  sponsorName: String!
  sponsorNumber: String!
  whatsappNumber: String!
  emiratesId: String!
  emirate: String!
  uidNumber: String!
  address: String!
  comments: String
  accountNumber: String!
  applicationPriority: ApplicationPriority!
  applicationType: ApplicationType!
  serviceId: ID
}

input UpdateApplicationInput {
  id: ID!
  visaType: VisaType
  sponsorName: String
  sponsorNumber: String
  whatsappNumber: String
  emiratesId: String
  emirate: String
  uidNumber: String
  address: String
  comments: String
  accountNumber: String
  applicationPriority: ApplicationPriority
  applicationType: ApplicationType
}

type Query {
  getApplication(id: ID!): Application
  getApplications(take: Int skip: Int): Application
  listVisaApplications(applicantId: ID, limit: Int, offset: Int): [Application!]!
}

type Mutation {
  createApplication(input: CreateApplicationInput!): Application!
  updateApplication(input: UpdateApplicationInput!): Application!
  deleteApplication(id: ID!): Boolean!

  # optional helper to attach / remove single file without full update
  addFileToApplication(applicationId: ID!, file: CreateDocumentInput!): Application!
  removeFileFromApplication(fileId: ID!): Boolean!
}

`;

export default application;