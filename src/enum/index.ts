export enum InvoiceStatus {
    PAID='PAID',
    UNPAID='UNPAID',
  }

export enum PaymentMethodType {
  CASH='CASH',
  CARD='CARD', 
  ONLINE='ONLINE'
  }

  export enum BillingType {
    NEW = 'NEW',
    RENEW = 'RENEW',
  }

  export enum VisaType {
    EMIRATESID   = 'EMIRATESID',
    GOLDENVISA   = 'GOLDENVISA',
    MEDICALTEST  = 'MEDICALTEST',
    INSURANCE    = 'INSURANCE',
    RESIDENCE    = 'RESIDENCE',
    TOURIST      = 'TOURIST',
  }

  export enum ApplicationPriority {
    LOW     = 'LOW',
    MEDIUM  = 'MEDIUM',
    HIGH    = 'HIGH',
    URGENT  = 'URGENT',
  }
  
  export enum ApplicationType {
    NEW          = 'NEW',
    RENEWAL      = 'RENEWAL',
    CANCELLATION = 'CANCELLATION',
    MODIFICATION = 'MODIFICATION',
  }

  export enum AttributeType {
    FIELD = "FIELD",
    DOCUMENT = "DOCUMENT",
    INPUT="INPUT" ,
    TEXTAREA="TEXTAREA",
    PHONE="PHONE" ,
    FILE="FILE"  ,
    DROPDOWN="DROPDOWN",
    COLLAPSIBLE_SECTION= "COLLAPSIBLE_SECTION",
    DATE="DATE",
    CHECK_BOX="CHECK_BOX",
  }

export enum FormStatus {
    COMPLETED = 'COMPLETED',
    UNDER_PROGRESS = 'UNDER_PROGRESS',
    REJECTED = 'REJECTED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    RETURN_MODIFICATION = 'RETURN_MODIFICATION',
}