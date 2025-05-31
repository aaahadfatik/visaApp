import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import User from './User';
import BaseEntity from './BaseEntity';

@Entity()
export default class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @ManyToOne(() => User, (user) => user.notifications)
  user!: User; // The user receiving the notification
}
