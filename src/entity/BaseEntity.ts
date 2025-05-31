import {Entity,CreateDateColumn,UpdateDateColumn,Column,} from 'typeorm';
  
  @Entity()
  export default abstract class BaseEntity {
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
  
    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date;
  
    @Column({ nullable: true })
    createdBy?: string;
  
    @Column({ nullable: true })
    updatedBy?: string;
  
    @Column({ default: false })
    isDeleted!: boolean;
  
    @Column({ nullable: true })
    deletedAt?: Date;
  
    @Column({ nullable: true })
    deletedBy?: string;
  }
  