import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    OneToOne,
  } from "typeorm";
  import  Form  from "./Form"; // adjust the path based on your folder structure
import BaseEntity from "./BaseEntity";
import Document from "./Document";
import { FormStatus } from "../enum";
import Visa from "./Visa";
import Payment from "./Payment";
  
@Entity()
export default class FormSubmission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Form, (form) => form.submissions, { onDelete: "CASCADE" })
  form!: Form;

  @Column({ type: "jsonb" })
  answers!: any; // Use `Record<string, any>` if you want a typed version

  @OneToMany(() => Document, (d) => d.formSubmission, { cascade: true,nullable: true })
  documents!: Document[];

  @Column({type: 'enum', enum: FormStatus,nullable: true})
  status!: FormStatus

  @ManyToOne(() => Visa, (visa) => visa.submissions, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: 'visaId' })        
  visa!: Visa;

  @Column({ name: 'visaId', type: 'uuid', nullable: true })
  visaId?: string;  

  @OneToOne(() => Payment, (payment) => payment.formSubmission, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: "paymentId" })
  payment?: Payment;
  
  @Column({ name: "paymentId", type: "uuid", nullable: true })
  paymentId?: string;
}
  