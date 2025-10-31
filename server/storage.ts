import { type User, type InsertUser, type Visitor, type InsertVisitor, type VisitorCounts, users, visitors } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, gte, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Visitor tracking methods
  trackVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>>;
  getAllVisitors(): Promise<Visitor[]>;
}

export class JsonFileStorage implements IStorage {
  private dataFilePath: string;
  private data: {
    users: Map<string, User>;
    visitors: Map<string, Visitor>;
  };

  constructor(dataFilePath: string = "data/visitors_data.json") {
    this.dataFilePath = dataFilePath;
    this.data = {
      users: new Map(),
      visitors: new Map(),
    };
    this.loadData();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dir = path.dirname(this.dataFilePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private async loadData(): Promise<void> {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(this.dataFilePath, "utf-8");
      const parsedData = JSON.parse(data);
      
      // Convert arrays back to Maps
      this.data.users = new Map(parsedData.users || []);
      this.data.visitors = new Map(parsedData.visitors || []);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      this.data = {
        users: new Map(),
        visitors: new Map(),
      };
      await this.saveData();
    }
  }

  private async saveData(): Promise<void> {
    try {
      await this.ensureDataDirectory();
      const dataToSave = {
        users: Array.from(this.data.users.entries()),
        visitors: Array.from(this.data.visitors.entries()),
      };
      await fs.writeFile(this.dataFilePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error("Error saving data to JSON file:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.data.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.data.users.set(id, user);
    await this.saveData();
    return user;
  }

  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const id = randomUUID();
    const visitor: Visitor = {
      userId: insertVisitor.userId || null,
      page: insertVisitor.page,
      referrer: insertVisitor.referrer || null,
      userAgent: insertVisitor.userAgent || null,
      ip: insertVisitor.ip || null,
      id,
      timestamp: new Date(),
    };
    this.data.visitors.set(id, visitor);
    await this.saveData();
    return visitor;
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return Array.from(this.data.visitors.values());
  }

  async getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>> {
    const now = new Date();
    const visitors = Array.from(this.data.visitors.values());
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const counts = {
      today: visitors.filter(v => v.timestamp && new Date(v.timestamp) >= startOfToday).length,
      week: visitors.filter(v => v.timestamp && new Date(v.timestamp) >= startOfWeek).length,
      month: visitors.filter(v => v.timestamp && new Date(v.timestamp) >= startOfMonth).length,
      year: visitors.filter(v => v.timestamp && new Date(v.timestamp) >= startOfYear).length,
    };

    if (period) {
      return { [period]: counts[period] };
    }

    return counts;
  }
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
      userId: insertVisitor.userId || null,
      page: insertVisitor.page,
      referrer: insertVisitor.referrer || null,
      userAgent: insertVisitor.userAgent || null,
      ip: insertVisitor.ip || null,
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

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const result = await this.db.insert(visitors).values(insertVisitor).returning();
    return result[0];
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return await this.db.select().from(visitors);
  }

  async getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>> {
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    if (period) {
      let startDate: Date;
      switch (period) {
        case 'today': startDate = startOfToday; break;
        case 'week': startDate = startOfWeek; break;
        case 'month': startDate = startOfMonth; break;
        case 'year': startDate = startOfYear; break;
      }
      
      const result = await this.db.select({ count: sql<number>`count(*)::int` })
        .from(visitors)
        .where(gte(visitors.timestamp, startDate));
      
      return { [period]: result[0].count };
    }

    // Get all counts in parallel using SQL
    const [todayResult, weekResult, monthResult, yearResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(visitors).where(gte(visitors.timestamp, startOfToday)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(visitors).where(gte(visitors.timestamp, startOfWeek)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(visitors).where(gte(visitors.timestamp, startOfMonth)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(visitors).where(gte(visitors.timestamp, startOfYear)),
    ]);

    return {
      today: todayResult[0].count,
      week: weekResult[0].count,
      month: monthResult[0].count,
      year: yearResult[0].count,
    };
  }
}

// Use DatabaseStorage if DATABASE_URL is set, otherwise fall back to JsonFileStorage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new JsonFileStorage();