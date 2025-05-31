import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToOne, OneToMany } from 'typeorm';
import BaseEntity from './BaseEntity';
import User from './User';

@Entity()
export default class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; 

  @OneToMany(() => User, (user) => user.role)
  users?: User[];
}
