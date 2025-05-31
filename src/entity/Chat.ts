import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Column,
  } from 'typeorm';
  import BaseEntity from './BaseEntity';
  import User from './User';
  import Message from './Message';
  
  @Entity()
  export default class Chat extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'senderId' })
    sender!: User;
  
    @Column()
    senderId!: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'receiverId' })
    receiver!: User;
  
    @Column()
    receiverId!: string;
  
    @OneToMany(() => Message, (message) => message.chat)
    messages!: Message[];
  }
  