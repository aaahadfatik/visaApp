import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import BaseEntity from './BaseEntity';
  import User from './User';
  import Chat from './Chat';
  
  @Entity()
  export default class Message extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column('text')
    content!: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'senderId' })
    sender!: User;
  
    @Column()
    senderId!: string;
  
    @ManyToOne(() => Chat, (chat) => chat.messages)
    @JoinColumn({ name: 'chatId' })
    chat!: Chat;
  
    @Column()
    chatId!: string;
  }
  