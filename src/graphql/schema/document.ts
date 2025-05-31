import { gql } from 'apollo-server';

const document = gql`
scalar DateTime

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
}
`;

export default document;
