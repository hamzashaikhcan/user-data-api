import { User, UserRepository } from '../models/user';
import cacheService from './cacheService';
import queueService from './queueService';
import monitoringService from './monitoringService';

class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getUserById(id: number): Promise<User | null> {
    // Use cache service with LRU strategy
    return cacheService.get(id, async () => {
      // If not in cache, fetch through the queue service
      const user = await queueService.fetchUser(id);
      return user;
    });
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const newUser = await queueService.createUser(userData);
    cacheService.get(newUser.id, async () => newUser);
    
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    // This endpoint doesn't use cache as it's expected to be less common
    // and we'd need a different caching strategy for collections
    try {
      // Special handling of -1 ID to get all users
      const results = await queueService.fetchUser(-1) as unknown as User[];
      return Array.isArray(results) ? results : [];
    } catch (error) {
      monitoringService.logError(error as Error, { context: 'userService.getAllUsers' });
      return [];
    }
  }
}

// Create singleton instance
const userService = new UserService();
export default userService;