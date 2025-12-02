import { gql } from 'apollo-server';

const application = gql`
scalar DateTime
scalar JSON

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

type Passenger {
  id: ID!
  name: String!
  dob: String!
  isChild: Boolean!
  application: Application!
}

type Application {
  id: ID!
  applicant: User!
  files: [Document!]!
  visaType: VisaType!
  sponsorName: String!
  sponsorNumber: String!
  whatsappNumber: String!
  uidNumber: String!
  address: String!
  comments: String
  accountNumber: String!
  applicationPriority: ApplicationPriority!
  applicationType: ApplicationType!
  createdAt: DateTime!
  passengerCount: Int!

  passengers: [Passenger!]!
  service: Service
}

input PassengerInput {
  name: String!
  dob: String!
  isChild: Boolean
}

input CreateApplicationInput {
  applicantId: String!
  files: [CreateDocumentInput!]!
  visaType: VisaType!
  sponsorName: String!
  sponsorNumber: String!
  whatsappNumber: String!
  uidNumber: String!
  address: String!
  comments: String
  accountNumber: String!
  applicationPriority: ApplicationPriority!
  applicationType: ApplicationType!
  serviceId: ID
  passengerCount: Int!
  passengers: [PassengerInput!]!
}

input UpdateApplicationInput {
  id: ID!
  visaType: VisaType
  sponsorName: String
  sponsorNumber: String
  whatsappNumber: String
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
  updateApplication(applicationId: String!): FormSubmission!
  deleteApplication(id: ID!): Boolean!

  # optional helper to attach / remove single file without full update
  addFileToApplication(applicationId: ID!, file: CreateDocumentInput!): Application!
  removeFileFromApplication(fileId: ID!): Boolean!
}

`;

export default application;