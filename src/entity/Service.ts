import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Generated, ManyToMany } from 'typeorm';
import BaseEntity from './BaseEntity';
import Category from './Category';

@Entity()
export default class Service extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  isForSale!: boolean;

  @OneToMany(() => Category, (category) => category.service)
  categories!: Category[];

  // @Column("text")
  // description!: string;

  // @Column({ type: "float", default: 0 })
  // price!: number;

  // @Column({ default: false })
  // isFeature!: boolean;

  // @Column({ nullable: true })
  // imageUrl?: string;

  // @Column({ default: 0 })
  // salesCount!: number;

  // @OneToMany(() => Application, (app) => app.service)
  // applications!: Application[];
}
