import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { RoleStatus } from '../../common/enums/role-status.enum';
import { RolePermissionAssignments } from 'src/role-permission-assignments/entities/role-permission-assignment.entity';
import { UserRoleAssignments } from '../../user-role-assignments/entities/user-role-assignments.entity';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    name: 'role_id',
    type: 'varchar',
    length: 5,
    nullable: true,
    insert: false,
    update: false,
  })
  roleId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status!: RoleStatus | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6, nullable: true })
  createdAt!: Date | null;

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6, nullable: true })
  updatedAt!: Date | null;

  @Column({ name: 'updated_by', type: 'char', length: 36, nullable: true })
  updatedBy!: string | null;

  @OneToMany(() => UserRoleAssignments, (rpa) => rpa.role, { cascade: false })
  userRoleAssignments!: UserRoleAssignments[];

  @OneToMany(() => RolePermissionAssignments, (rpa) => rpa.role, { cascade: false })
  rolePermissionAssignments!: RolePermissionAssignments[];
}
