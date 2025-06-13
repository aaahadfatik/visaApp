import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
import User from './User';
import BaseEntity from './BaseEntity';
import Document from './Document';
import { VisaType,ApplicationPriority,ApplicationType } from '../enum';
import Service from './Service';
  
@Entity()
export default class Application extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  applicant!: User;     
  
  @OneToMany(() => Document, (f) => f.application, { cascade: true,nullable: true })
  files!: Document[];

  @Column({ type: 'enum', enum: VisaType })
  visaType!: VisaType;

  @Column()
  sponsorName!: string;

  @Column()
  sponsorNumber!: string;

  @Column()
  whatsappNumber!: string;

  @Column()
  emiratesId!: string;

  @Column()
  emirate!: string;                                  

  @Column()
  uidNumber!: string;

  @Column()
  address!: string;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column()
  accountNumber!: string;

  @Column({ type: 'enum', enum: ApplicationPriority, default: ApplicationPriority.MEDIUM })
  applicationPriority!: ApplicationPriority;

  @Column({ type: 'enum', enum: ApplicationType })
  applicationType!: ApplicationType;

  @ManyToOne(() => Service, { eager: true, nullable: true })
  service!: Service;
}
  