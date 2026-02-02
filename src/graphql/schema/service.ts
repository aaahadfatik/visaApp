import { gql } from "apollo-server";

const service = gql`
  enum AttributeType {
    FIELD
    DOCUMENT
    INPUT
    TEXTAREA
    PHONE
    FILE
    DROPDOWN
    COLLAPSIBLE_SECTION
    DATE
    CHECK_BOX
  }

  enum FormStatus {
    COMPLETED
    UNDER_PROGRESS
    REJECTED
    RETURN_MODIFICATION
  }

  type Service {
    id: ID!
    title: String!
    isForSale: Boolean!
    imageUrl: String
    description: String
    categories: [Category!]
    visas: [Visa!]
  }

  type Category {
    id: ID!
    title: String!
    vipPrice: Float
    vvipPrice: Float
    normalPrice: Float
    description: [String!]
    info: [String!]
    isForSale: Boolean!
    service: Service!
    visas: [Visa!]!
    form: Form
    submissions: [FormSubmission!]
  }

  type CategoryAttribute {
    id:ID!
    name: String!
    value: String!
    category: Category!
  }

  type Visa {
    id: ID!
    title: String!
    vipPrice: Float!
    vvipPrice: Float!
    normalPrice: Float!
    description: [String!]
    info: [String!]
    category: Category
    form: Form
    submissions: [FormSubmission!]
    service: Service
  }

  type Form {
    id: ID!
    attributes: [FormAttribute!]!
    visa: Visa
    submissions: [FormSubmission!]
    category: Category
  }

  type FormAttribute {
    id: ID!
    name: String
    label: String
    type: AttributeType
    placeholder: String
    options: [String!]
    multiple: Boolean
    required: Boolean
    stepperLabel: String
    children: [FormAttribute!]
  }

  type FormSubmission {
    id: ID!
    formId: ID
    answers: [FormAnswer!]!
    documents: [Document!]
    status: FormStatus
    visa: Visa
    reasonForReturn: String
    reasonForRejection: String
    createdAt: DateTime
    updatedAt: DateTime
    createdBy: User
    payment: Payment
    service:Service
    category: Category
  }

  type FormAnswer {
    name: String!
    value: JSON!
    children: [FormAnswer!]
  }

  input CreateServiceInput {
    title: String!
    isForSale: Boolean
    imageUrl: String
    description: String
  }

  input UpdateServiceInput {
    id: ID!
    title: String
    isForSale: Boolean
    imageUrl: String
    description: String
  }

  input CategoryAttributeInput {
    name: String!
    value: String!
  }
  input CreateCategoryInput {
    title: String!
    isForSale: Boolean
    vipPrice: Float
    vvipPrice: Float
    normalPrice: Float
    description: [String!]
    info: [String!]
    serviceId: ID!
    categoryAttributes: [CategoryAttributeInput!]
  }

  input UpdateCategoryInput {
    id: ID!
    title: String
    isForSale: Boolean
    serviceId: ID
  }

  input UpdateCategoryAttributeInput {
    id: ID!
    name: String
    value: String
    }

  input CreateVisaInput {
    title: String!
    vipPrice: Float!
    vvipPrice: Float!
    normalPrice: Float!
    categoryId: ID!
    description: [String!]
    info: [String!]
    serviceId: ID
  }

  input UpdateVisaInput {
    id: ID!
    title: String
    vipPrice: Float
    vvipPrice: Float
    normalPrice: Float
    categoryId: ID
    description: [String!]
    info: [String!]
    serviceId: ID
  }

  input FormAttributeInput {
    name: String!
    label: String!
    type: AttributeType!
    placeholder: String
    required: Boolean!
    multiple: Boolean
    options: [String!]
    stepperLabel: String
    children: [FormAttributeInput!]
  }

  input CreateDocumentInput {
    title: String!
    fileName: String!
    fileType: String!
    filePath: String!
    description: String
  }

  input CreateFormInput {
    attributes: [FormAttributeInput!]!
    documents: [CreateDocumentInput!]
    categoryId: String!
  }

  input FormAnswerInput {
    name: String!
    value: JSON! # You can use GraphQL scalar JSON
    children: [FormAnswerInput!]
  }

  input SubmitFormInput {
    formId: ID!
    categoryId: ID!
    answers: [FormAnswerInput!]!
    documents: [CreateDocumentInput!]
  }

  input FormFilter {
    search: String
    serviceId: ID
    status: FormStatus
    startDate: DateTime
    endDate: DateTime
  }

  type FormSubmissionStatistics {
    totalSubmissions: Int!
    completedSubmissions: Int!
    underProgressSubmissions: Int!
    rejectedSubmissions: Int!
    returnModificationSubmissions: Int!
  }

  type ServiceStatistics {
    serciveId: ID!
    title: String!
    totalApplications: Int!
  }

  type SeriveStatisticsReturn {
    statistics: [ServiceStatistics!]!
  }

  type ApplicationStatusCount {
    status: FormStatus!
    percentage: Float!
  }

  type FormSubmissionReturn {
    submissions: [FormSubmission!]!
    total: Int!
  }
  
  type ServiceReturn {
    services: Service!
    total: Int!
    pendingSubmission: Int!
    completedSubmission: Int!
  }

  type Query {
    getServices(search: String): [ServiceReturn!]!
    getServiceById(id: ID!): Service

    getCategories(serviceId:ID): [Category!]!
    getCategoryById(id: ID!, search: String): Category

    getVisas(title: String): [Visa!]!
    getVisaById(id: ID!): Visa

    getForms: [Form]
    getFormByVisaId(visaId: ID!): Form
    getFormByCategoryId(categoryId: ID!): Form

    getSubmittedForms(
      limit: Int
      offset: Int
      filter: FormFilter
    ): FormSubmissionReturn!
    getSubmittedFormById(id: ID!): FormSubmission
    getUserSubmittedForms(userId: ID!): [FormSubmission!]!
    getUserSubmittedPendingForms(userId: ID!): [FormSubmission!]!

    getSubmittedFormsStatistics: FormSubmissionStatistics!
    getServiceStatistics(year: String): SeriveStatisticsReturn!
    getSubmittedFromAppicationStatusGraph(
      year: String
    ): [ApplicationStatusCount!]!
  }

  type Mutation {
    createService(input: CreateServiceInput!): Service!
    updateService(input: UpdateServiceInput!): Service!

    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!

    updateCategoryAttribute(input: UpdateCategoryAttributeInput!): CategoryAttribute!

    createVisa(input: CreateVisaInput!): Visa!
    updateVisa(input: UpdateVisaInput!): Visa!

    deleteVisa(id: ID!): Boolean!
    deleteService(id: ID!): Boolean!

    createForm(input: CreateFormInput!): Form!

    submitForm(input: SubmitFormInput!): FormSubmission!
    updateFormSubmissionStatus(
      id: ID!
      status: FormStatus
      paymentId: ID
      reasonForReturn: String
      reasonForRejection: String
    ): FormSubmission!
  }
`;

export default service;
