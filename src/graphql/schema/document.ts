import { gql } from 'apollo-server';

const document = gql`
scalar DateTime
scalar Upload

type Payment {
  id: ID!
  nomodId: String!
  title: String!
  url: String!
  amount: String!
  currency: String!
  status: String!
  note: String
  items: [JSON!]!
  discount: String
  service_fee: String
  requestPayload: JSON
  custom_fields: [JSON!]
  allow_tip: Boolean
  allow_tabby: Boolean
  allow_tamara: Boolean
  allow_service_fee: Boolean
  failure_url: String
  success_url: String
  payment_expiry_limit: Int
  expiry_date: String
}

type Document {
  id: ID!
  title: String!
  fileName: String
  fileType: String
  filePath: String
  description: String
}

input CreateDocumentInput {
  title: String!
  fileName: String
  fileType: String
  filePath: String
  description: String
}

input UpdateDocumentInput {
  id: ID!
  title: String
  fileName: String
  fileType: String
  filePath: String
  description: String
}

type Query {
  getDocuments(limit: Int, offset: Int): [Document!]!
  getDocument(id: ID!): Document
}

type Mutation {
  createDocument(input: CreateDocumentInput!): Document!
  updateDocument(input: UpdateDocumentInput!): Document!
  deleteDocument(id: ID!): Boolean!
  uploadFile(file: Upload!, title: String!, description: String): Document!
}
`;

export default document;
