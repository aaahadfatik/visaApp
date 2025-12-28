import { User, Role } from "../entity";
import { ApplicationType, ApplicationPriority, AttributeType, FormStatus } from "../enum";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface CreateRoleInput {
  name: string
  isReadOrder: boolean
  isManageOrder: boolean
  isReadMenu: boolean
  isManageMenu: boolean
  isManageIngredients: boolean
  isManageCosts: boolean
  isManageBranch: boolean
  isManageCoupons: boolean
  isManageDevices: boolean
  isManageDiscounts: boolean
  isManageGiftCards: boolean
}

export interface UpdateRoleInput {
  id:string;
  name: string
  isReadOrder: boolean
  isManageOrder: boolean
  isReadMenu: boolean
  isManageMenu: boolean
  isManageIngredients: boolean
  isManageCosts: boolean
  isManageBranch: boolean
  isManageCoupons: boolean
  isManageDevices: boolean
  isManageDiscounts: boolean
  isManageGiftCards: boolean
}

export interface CreateUserInput {
  name: string
  organizationName: string
  position: string
  phone: string
  email: string
  password: string
  picture: string
  otp:number
  isCompany: boolean
  isActive: boolean
  isProfileCompleted: boolean
  lastLoginDate: string
  refreshToken: string
  roleId: string
  fcmToken?:string
  documents: [CreateDocumentInput]
}

export interface UpdateUserInput {
  id:string;
  name: string
  organizationName: string
  position: string
  phone: string
  email: string
  password: string
  otp:number
  isCompany: boolean
  isActive: boolean
  isProfileCompleted: boolean
  lastLoginDate: string
  refreshToken: string
  picture: string
  roleId: string
  fcmToken:string
}

export interface UserFilter {
  status?: boolean;
  type?: string;
  search?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Decoded {
  userId: string;
  role: Role; 
  pin: number;
  branchId?: string;
}

export interface PermissionRequirements {
  [key: string]: boolean;
}

export interface CreateDocumentInput {
  title: string
  fileName: string
  fileType: string
  filePath: string
  description?: string
}
export interface UpdateDocumentInput {
  id:string;
  title: string
  fileName: string
  fileType: string
  filePath: string
  description?: string
}
export interface CreateNotificationInput {
  title: string
  description: string
  type: string
  userId: string
  applicationId: string
  isRead: boolean
  isDeleted: boolean
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}
export interface UpdateNotificationInput {
  id:string;
  title: string
  description: string
  type: string
  userId: string
  applicationId: string
  isRead: boolean
  isDeleted: boolean
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}
export interface PassengerInput {
  name: string;
  dob: string;
  isChild?: boolean; 
}
export interface CreateApplicationInput {
  applicantId: string
  files: CreateDocumentInput[]
  visaType: string
  sponsorName: string
  sponsorNumber: string
  whatsappNumber: string
  uidNumber: string
  address: string
  comments: string
  accountNumber: string
  applicationPriority: ApplicationPriority
  applicationType: ApplicationType
  serviceId?: string
  passengerCount: number;
  passengers: PassengerInput[];
}

export interface UpdateApplicationInput {
  id: string
  visaType: string
  sponsorName: string
  sponsorNumber: string
  whatsappNumber: string
  uidNumber: string
  address: string
  comments: string
  accountNumber: string
  applicationPriority: ApplicationPriority
  applicationType: ApplicationType
}

export interface CreateServiceInput {
  title: string;
  isForSale?: boolean;
  imageUrl?: string;
  description?: string;
  categoryIds?: string[];
}

export interface UpdateServiceInput {
  id: string;
  title?: string;
  isForSale?: boolean;
  imageUrl?: string;
  description?: string;
  categoryIds?: string[];
}

export interface CreateCategoryInput {
  title: string;
  isForSale?: boolean;
  serviceId: string;
}

export interface UpdateCategoryInput {
  id: string;
  title?: string;
  isForSale?: boolean;
  serviceId?: string; // single ID, not an array
}

export interface CreateVisaInput {
  title: string;
  vipPrice: number;
  vvipPrice: number;
  normalPrice: number;
  categoryId: string;
  description?: string[]; 
  info?: string[];
}

export interface UpdateVisaInput {
  id: string;
  title?: string;
  vipPrice?: number;
  vvipPrice?: number;
  normalPrice?: number;
  categoryId?: string;
  description?: string[]; 
  info?: string[];
}

export interface CreateFormInput {
  visaId: string;
  attributes: FormAttributeInput[];
}

export interface FormAttributeInput {
  id: string;
  name: string; // e.g. "applicantName"
  type: AttributeType; // e.g. "input" or "docupload"
  label: string;
  placeholder?: string;
  required: boolean;
  multiple: boolean;
  options?: string[]; // for dropdowns
  children: FormAttributeInput[]
}

export interface FormAnswerInput {
  attributeName: string;
  values: any[]; // Using JSON scalar
  children?: FormAnswerInput[];
}

export interface SubmitFormInput {
  formId: string;
  visaId: string;
  answers: FormAnswerInput[];
  documents: CreateDocumentInput[];
}

export interface FormFilter {
  search?: string;
  serviceId?: string;
  status?: FormStatus;
  startDate?: string;
  endDate?: string;
}


export type FormAttributeType = 'FIELD' | 'DOCUMENT';

export interface NotificationFilter {
search?:string;
isRead?: boolean;
startDate?:string;
endDate?:string;
 page?: number;
 limit?: number;
}