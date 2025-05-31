
  
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
    TOURIST      = 'TOURIST',
    RESIDENCE    = 'RESIDENCE',
    MEDICALTEST  = 'MEDICALTEST',
    INSURANCE    = 'INSURANCE',
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