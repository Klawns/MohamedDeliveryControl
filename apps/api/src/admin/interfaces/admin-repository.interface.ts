export const IAdminRepository = Symbol('IAdminRepository');

export interface RecentAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  plan: 'starter' | 'premium' | 'lifetime' | null;
  validUntil: Date | null;
}

export interface IAdminRepository {
  getUsersCount(adminEmail: string): Promise<number>;
  getActiveSubscriptionsCount(): Promise<number>;
  getRecentUsers(
    adminEmail: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: RecentAdminUser[];
    total: number;
  }>;
  deleteUser(id: string): Promise<void>;
}
