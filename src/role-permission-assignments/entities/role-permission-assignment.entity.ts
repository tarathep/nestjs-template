import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Roles } from '../../roles/entities/role.entity';
import { Permissions } from '../../permissions/entities/permission.entity';

@Entity('role_permission_assignments')
export class RolePermissionAssignments {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  role_id!: number;

  @Column({ type: 'varchar', length: 20 })
  permission_id!: string;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
  })
  updated_at!: Date;

  @Column({
    name: 'updated_by',
    type: 'char',
    length: 36,
    nullable: true,
  })
  updated_by!: string | null;

  @ManyToOne(() => Roles, (role) => role.rolePermissionAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Roles;

  @ManyToOne(() => Permissions, (perm) => perm.rolePermissionAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permissions;
}
