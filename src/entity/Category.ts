import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Generated, ManyToMany } from 'typeorm';
import BaseEntity from './BaseEntity';
import Service from './Service';
import Visa from './Visa';

@Entity()
export default class CateGory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  isForSale!: boolean;

  @ManyToOne(() => Service, (service) => service.categories, { onDelete: "CASCADE" })
  service!: Service;

  @OneToMany(() => Visa, (visa) => visa.category)
  visas!: Visa[];
}
