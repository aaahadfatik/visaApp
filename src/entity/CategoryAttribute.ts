import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import BaseEntity from "./BaseEntity";
import Category from "./Category";

@Entity()
export default class CategoryAttribute extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name?: string;

  @Column()
  value?: string;

  @ManyToOne(() => Category, (category) => category.submissions, {
    nullable: true,
    onDelete: "CASCADE",
  })
  category!: Category;
}
