import {
  Entity, PrimaryGeneratedColumn, OneToMany, Column,
  ManyToOne
} from 'typeorm';
import BaseEntity from './BaseEntity';
import Role from './Role';
import Document from './Document';
import Notification from './Notification';
import Application from './Application';
import FormSubmission from './FormSubmission';

@Entity()
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column()
  phone?: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  picture!: string;

  @Column({ nullable: true })
  organizationName?: string;

  @Column({ nullable: true })
  position?: string;

  @Column()
  password!: string;

  @Column({ default: false })
  isSalary?: boolean;

  @Column({ default: false })
  isExpirence?: boolean;

  @Column({ default: 0 })
  otp!: number

  @Column({ default: false })
  isActive?: boolean;

  @Column({ default: false })
  isCompany?: boolean;

  @Column({ default: false })
  isProfileCompleted?: boolean;

  @Column({ nullable: true })
  lastLoginDate?: Date;

  @Column({ nullable: true })
  refreshToken!: string;

  @Column({ nullable: true })
  roleId?: string;

  @Column({ nullable: true })
  fcmToken?: string

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  role!: Role;

  @OneToMany(() => Document, document => document.user)
  documents!: Document[];

  @OneToMany(() => Notification, (notification) => notification.user, { nullable: true })
  notifications?: Notification[];

  @OneToMany(() => Application, (a) => a.applicant)
  applications!: Application[];

  @OneToMany(() => FormSubmission, (submission) => submission.user)
  submissions!: FormSubmission[];
}
