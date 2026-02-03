import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserRoleAssignments } from 'src/user-role-assignments/entities/user-role-assignments.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedRefreshToken?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: 'emp_id', type: 'varchar', length: 20, nullable: true })
  empId!: string | null;

  @Column({ name: 'last_logged', type: 'datetime', precision: 6, nullable: true })
  lastLogged!: Date | null;

  @Column({ name: 'login_count', type: 'int', unsigned: true, default: 0 })
  loginCount!: number;

  @OneToMany(() => UserRoleAssignments, (ura) => ura.user, { cascade: false })
  userRoleAssignments!: UserRoleAssignments[];
}
