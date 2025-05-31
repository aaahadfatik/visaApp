import { User, Role } from "../entity";
import { ApplicationType, ApplicationPriority } from "../enum";

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
  otp:number
  isCompany: boolean
  isActive: boolean
  isProfileCompleted: boolean
  lastLoginDate: string
  refreshToken: string
  roleId: string
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
  roleId: string
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
export interface CreateApplicationInput {
  applicantId: string
  files: Document[]
  visaType: string
  sponsorName: string
  sponsorNumber: string
  whatsappNumber: string
  emiratesId: string
  emirate: string
  uidNumber: string
  address: string
  comments: string
  accountNumber: string
  applicationPriority: ApplicationPriority
  applicationType: ApplicationType
}

export interface UpdateApplicationInput {
  id: string
  visaType: string
  sponsorName: string
  sponsorNumber: string
  whatsappNumber: string
  emiratesId: string
  emirate: string
  uidNumber: string
  address: string
  comments: string
  accountNumber: string
  applicationPriority: ApplicationPriority
  applicationType: ApplicationType
}