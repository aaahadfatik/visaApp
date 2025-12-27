import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, OneToOne, OneToMany } from "typeorm";
import Category from "./Category";
import Form from "./Form";
import FormSubmission from "./FormSubmission";
import Service from "./Service";

@Entity()
export default class Visa extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column("float")
  vipPrice!: number;

  @Column("float")
  vvipPrice!: number;

  @Column("float")
  normalPrice!: number;

  @Column("text", { array: true, nullable: true })
  description!: string[]; 

  @Column("text", { array: true, nullable: true })
  info!: string[]; 

  @ManyToOne(() => Category, (category) => category.visas, { nullable: true, onDelete: "CASCADE" })
  category!: Category;

  @OneToOne(() => Form, (form) => form.visa)
  form!: Form;

  @OneToMany(() => FormSubmission, (submission) => submission.visa)
  submissions!: FormSubmission[];

  @ManyToOne(() => Service, (service) => service.visas, { nullable: true, onDelete: "CASCADE" })
  service?: Service;
}
