import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
import BaseEntity from './BaseEntity';
import Application from './Application';
  
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

    @ManyToOne(() => Application, (a) => a.files, { nullable: true })
    application!: Application;
  }
  