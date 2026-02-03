import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermissionAssignments } from 'src/role-permission-assignments/entities/role-permission-assignment.entity';

@Entity('permissions')
export class Permissions {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  createdAt!: Date | null;

  @OneToMany(() => RolePermissionAssignments, (rpa) => rpa.permission, {
    cascade: false,
  })
  rolePermissionAssignments!: RolePermissionAssignments[];
}
