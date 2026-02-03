import { Role } from 'src/common/enums/role.enum';

export type JwtPayload = {
  id: string;             
  username: string;       
  email: string;
  permissions: string[];  
  roles: Role[];          
  sessionId: string;      
};
