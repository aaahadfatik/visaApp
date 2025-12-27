import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToOne, JoinColumn, OneToMany } from "typeorm";
import Visa from "./Visa";
import FormAttribute from "./FormAttribute";
import  FormSubmission  from "./FormSubmission";
import Category from "./Category";

@Entity()
export default class Form extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => Visa, (visa) => visa.form, { onDelete: "CASCADE",nullable:true })
  @JoinColumn()
  visa!: Visa;

  @OneToMany(() => FormAttribute, (attribute) => attribute.form, { cascade: true })
  attributes!: FormAttribute[];

  @OneToMany(() => FormSubmission, (submission) => submission.form)
  submissions!: FormSubmission[];

  @OneToOne(() => Visa, (visa) => visa.form, { onDelete: "CASCADE", nullable:true})
  @JoinColumn()
  category!: Category;
}
