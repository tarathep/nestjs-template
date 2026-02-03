import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('sessions')
export class Sessions {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  session_id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  user_id!: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ip_addr!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'datetime', nullable: true })
  last_seen_at!: Date | null;
}
