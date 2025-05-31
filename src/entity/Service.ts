import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Generated } from 'typeorm';
import BaseEntity from './BaseEntity';

@Entity()
export default class Service extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column({ type: "float", default: 0 })
  price!: number;

  @Column({ default: false })
  isFeature!: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: false })
  isForSale!: boolean;

  @Column({ default: 0 })
  salesCount!: number;
}
