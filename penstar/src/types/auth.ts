export type User = {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  role_id?: number;
  role?: string;
} | null;
export type RolesMap = {
  byId: Record<number, string>;
  byName: Record<string, number>;
  order: string[];
} | null;
export type AuthContextType = {
  token: string | null;
  user: User;
  rolesMap: RolesMap;
  initialized?: boolean; 
  loginWithToken: (t: string) => void;
  logout: () => void;
  getRoleName: (u?: User) => string | null;
};
