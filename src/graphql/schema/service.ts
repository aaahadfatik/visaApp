import { gql } from 'apollo-server';

const service = gql`

type Service {
  id: ID!
  title: String!
  description: String!
  price: Float!
  tokenId: String!
  imageUrl: String
  salesCount: Int!
  isFeature: Boolean!
  isForSale: Boolean!

  applications: [Application!]!
}

input CreateServiceInput {
  title: String!
  description: String!
  price: Float!
  isFeature: Boolean
}

input UpdateServiceInput {
  id:ID!
  title: String
  description: String
  price: Float
  imageUrl: String
  isForSale: Boolean
  isFeature: Boolean
  salesCount: Int
  sellerSignature: String
  buyerSignature: String
}

type Query {
  getServices: [Service!]!
  getServiceById(id: ID!): Service
  getPopularServices(limit: Int!): [Service!]!
}

type Mutation {
  createService(input: CreateServiceInput!): Service!
  updateService(input: UpdateServiceInput!): Service!
}
`;

export default  service;
