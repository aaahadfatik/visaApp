import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
import BaseEntity from './BaseEntity';
import FormSubmission from './FormSubmission';
import User from './User';
  
  @Entity()
  export default class Document extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    title!: string;
  
    @Column()
    fileName!: string;
  
    @Column()
    fileType!: string; // e.g., 'pdf', 'jpg', 'docx'

    @Column()
    filePath!: string; // e.g., 'uploads/documents/filename.pdf'
  
    @Column({ nullable: true })
    description?: string;

    @ManyToOne(() => User, user => user.documents, {
      onDelete: 'CASCADE',nullable:true
    })
    @JoinColumn({ name: 'createdById' }) // FK column
    user!: User;

    @ManyToOne(() => FormSubmission, (f) => f.documents, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'formSubmissionId' }) // explicitly define FK
    formSubmission!: FormSubmission;
  }
  