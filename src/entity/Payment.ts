import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import BaseEntity from "./BaseEntity";
import FormSubmission from "./FormSubmission";

@Entity()
export default class Payment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nomodId!: string; // id returned by Nomod

  @Column()
  title!: string;

  @Column("text")
  url!: string;

  @Column("text")
  amount!: string;

  @Column()
  currency!: string;

  @Column()
  status!: string; // enabled | paid | expired | failed

  @Column("text", { nullable: true })
  note!: string;

  // JSON Array of payment items
  @Column("text")
  items!: any[];

  @Column({ nullable: true })
  discount!: string;

  @Column({ nullable: true })
  service_fee!: string;

  // metadata from request
  @Column("text", { nullable: true })
  requestPayload!: any;

  @Column("text", { nullable: true })
  custom_fields!: any[];

  @Column({ default: false })
  allow_tip!: boolean;

  @Column({ default: false })
  allow_tabby!: boolean;

  @Column({ default: false })
  allow_tamara!: boolean;

  @Column({ default: false })
  allow_service_fee!: boolean;

  @Column({ nullable: true })
  failure_url!: string;

  @Column({ nullable: true })
  success_url!: string;

  @Column({ nullable: true })
  payment_expiry_limit!: number;

  @Column({ nullable: true })
  expiry_date!: string;

  @OneToOne(() => FormSubmission, (submission) => submission.payment)
formSubmission!: FormSubmission;

}
