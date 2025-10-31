import { type User, type InsertUser, type Visitor, type InsertVisitor, type VisitorCounts, users, visitors } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, gte, and, sql } from "drizzle-orm";
import { MongoClient, type Db } from "mongodb";

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

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private initialized: boolean = false;

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db("visitors_analytics");
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.client.connect();
      this.initialized = true;
      console.log("Connected to MongoDB successfully");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.initialize();
    const user = await this.db.collection("users").findOne({ id });
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.initialize();
    const user = await this.db.collection("users").findOne({ username });
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.initialize();
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    await this.db.collection("users").insertOne(user);
    return user;
  }

  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    await this.initialize();
    const id = randomUUID();
    const visitor: Visitor = {
      id,
      userId: insertVisitor.userId || null,
      page: insertVisitor.page,
      referrer: insertVisitor.referrer || null,
      userAgent: insertVisitor.userAgent || null,
      ip: insertVisitor.ip || null,
      timestamp: new Date(),
    };
    await this.db.collection("visitors").insertOne(visitor);
    return visitor;
  }

  async getAllVisitors(): Promise<Visitor[]> {
    await this.initialize();
    const visitors = await this.db.collection("visitors").find({}).toArray();
    return visitors.map(v => ({
      id: v.id,
      userId: v.userId,
      page: v.page,
      referrer: v.referrer,
      userAgent: v.userAgent,
      ip: v.ip,
      timestamp: v.timestamp,
    }));
  }

  async getVisitorCounts(period?: 'today' | 'week' | 'month' | 'year'): Promise<VisitorCounts | Partial<VisitorCounts>> {
    await this.initialize();
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
      
      const count = await this.db.collection("visitors").countDocuments({
        timestamp: { $gte: startDate }
      });
      
      return { [period]: count };
    }

    // Get all counts in parallel
    const [todayCount, weekCount, monthCount, yearCount] = await Promise.all([
      this.db.collection("visitors").countDocuments({ timestamp: { $gte: startOfToday } }),
      this.db.collection("visitors").countDocuments({ timestamp: { $gte: startOfWeek } }),
      this.db.collection("visitors").countDocuments({ timestamp: { $gte: startOfMonth } }),
      this.db.collection("visitors").countDocuments({ timestamp: { $gte: startOfYear } }),
    ]);

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      year: yearCount,
    };
  }
}

// Use MongoDB if MONGODB_URI is set, otherwise use DatabaseStorage if DATABASE_URL is set, otherwise fall back to JsonFileStorage
export const storage = process.env.MONGODB_URI
  ? new MongoDBStorage(process.env.MONGODB_URI)
  : process.env.DATABASE_URL 
    ? new DatabaseStorage() 
    : new JsonFileStorage();