import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, OneToMany } from "typeorm";
import Form from "./Form";
import { AttributeType } from "../enum";

@Entity()
export default class FormAttribute extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: "enum", enum: AttributeType,default: AttributeType.INPUT })
  type!: AttributeType;

  @Column({})
  label!: string;

  @Column({ nullable: true })
  placeholder?: string;

  @Column({ type: "text", array: true, nullable: true })
  options?: string[];  

  @Column({ default: false })
  required!: boolean;

  @Column({ default: false })
  multiple!: boolean;

  @Column({ default: false })
  isChild!: boolean;

  @Column({ nullable: true })
  stepperLabel?: string;

  @ManyToOne(() => Form, (form) => form.attributes, { onDelete: "CASCADE" })
  form!: Form;

  @ManyToOne(() => FormAttribute, (attribute) => attribute.children, { nullable: true })
  parent?: FormAttribute;

  @OneToMany(() => FormAttribute, (attribute) => attribute.parent)
  children?: FormAttribute[];
}
