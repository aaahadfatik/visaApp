import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import BaseEntity from './BaseEntity';
import Visa from './Visa';
import Category from './Category';

@Entity()
export default class Service extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  isForSale!: boolean;

  @Column("text",{nullable:true})
  description!: string;

  @Column("text",{nullable:true})
  imageUrl!: string;

  @OneToMany(() => Category, (category) => category.service)
  categories!: Category[];

  @OneToMany(() => Visa, (visa) => visa.service)
  visas!: Visa[];
}
