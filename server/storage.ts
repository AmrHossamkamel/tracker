import { type User, type InsertUser, type Visitor, type InsertVisitor, type VisitorCounts } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Visitor tracking methods
  trackVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>>;
  getAllVisitors(): Promise<Visitor[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private visitors: Map<string, Visitor>;

  constructor() {
    this.users = new Map();
    this.visitors = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const id = randomUUID();
    const visitor: Visitor = {
      ...insertVisitor,
      id,
      timestamp: new Date(),
    };
    this.visitors.set(id, visitor);
    return visitor;
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values());
  }

  async getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>> {
    const now = new Date();
    const visitors = Array.from(this.visitors.values());
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const counts = {
      today: visitors.filter(v => v.timestamp && v.timestamp >= startOfToday).length,
      week: visitors.filter(v => v.timestamp && v.timestamp >= startOfWeek).length,
      month: visitors.filter(v => v.timestamp && v.timestamp >= startOfMonth).length,
      year: visitors.filter(v => v.timestamp && v.timestamp >= startOfYear).length,
    };

    if (period) {
      return { [period]: counts[period] };
    }

    return counts;
  }
}

export const storage = new MemStorage();
