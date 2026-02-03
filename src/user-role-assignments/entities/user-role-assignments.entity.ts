import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Roles } from '../../roles/entities/role.entity';

@Entity('user_role_assignments')
export class UserRoleAssignments {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  role_id!: number;

  @Column({ type: 'char', length: 36 })
  user_id!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
  })
  updated_at!: Date;

  @Column({ type: 'char', length: 36, nullable: true })
  updated_by!: string | null;

  @ManyToOne(() => User, (user) => user.userRoleAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Roles, (role) => role.userRoleAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Roles;
}
