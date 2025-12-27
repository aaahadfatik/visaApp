import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Generated, ManyToMany, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from './BaseEntity';
import Service from './Service';
import Visa from './Visa';
import FormSubmission from './FormSubmission';
import Form from './Form';

@Entity()
export default class CateGory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column("float",{default:0})
  vipPrice!: number;

  @Column("float",{default:0})
  vvipPrice!: number;

  @Column("float",{default:0})
  normalPrice!: number;

  @Column("text", { array: true, nullable: true })
  description!: string[]; 

  @Column("text", { array: true, nullable: true })
  info!: string[]; 

  @Column({ default: false })
  isForSale!: boolean;

  @ManyToOne(() => Service, (service) => service.categories, { onDelete: "CASCADE" })
  service!: Service;

  @OneToMany(() => Visa, (visa) => visa.category)
  visas!: Visa[];

  @OneToOne(() => Form, (form) => form.category, { cascade: true, nullable: true })
  @JoinColumn()
  form?: Form;

  // Relation to FormSubmission (multiple submissions per category)
  @OneToMany(() => FormSubmission, (submission) => submission.category)
  submissions!: FormSubmission[];
}
