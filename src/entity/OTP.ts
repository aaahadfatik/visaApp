import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
  } from "typeorm";
  import User from "./User";
  
  @Entity()
  export default class OTP extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
  
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user!: User;
  
    @Index()
    @Column()
    email!: string;
  
    // Store HASHED OTP
    @Column()
    otpHash!: string;
  
    @Column({ type: "timestamp" })
    expiresAt!: Date;
  
    @Column({ default: false })
    isUsed!: boolean;
  
    @CreateDateColumn()
    createdAt!: Date;
  }
  