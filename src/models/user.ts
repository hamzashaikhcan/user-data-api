export interface User {
    id: number;
    name: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  // Mock database
  export const mockUsers: Record<number, User> = {
    1: { id: 1, name: "John Doe", email: "john@example.com" },
    2: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    3: { id: 3, name: "Alice Johnson", email: "alice@example.com" }
  };
  
  export class UserRepository {
    private users: Record<number, User> = { ...mockUsers };
    private lastId: number = 3;
  
    async findById(id: number): Promise<User | null> {
      // Simulate database delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.users[id] || null);
        }, 200);
      });
    }
  
    async create(userData: Omit<User, 'id'>): Promise<User> {
      // Simulate database delay
      return new Promise((resolve) => {
        setTimeout(() => {
          const newId = ++this.lastId;
          const now = new Date();
          const newUser: User = {
            id: newId,
            ...userData,
            createdAt: now,
            updatedAt: now
          };
          this.users[newId] = newUser;
          resolve(newUser);
        }, 200);
      });
    }
  
    async getAll(): Promise<User[]> {
      // Simulate database delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(Object.values(this.users));
        }, 200);
      });
    }
  }