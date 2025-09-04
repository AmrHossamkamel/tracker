import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { trackVisitorSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Track a visitor
  app.post("/api/visitors/track", async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Validate request body
      const validatedData = trackVisitorSchema.parse(req.body);
      
      // Extract IP from request if not provided
      const ip = validatedData.ip || req.ip || req.connection.remoteAddress || 'unknown';
      
      // Extract user agent if not provided
      const userAgent = validatedData.userAgent || req.get('User-Agent') || 'unknown';
      
      const visitor = await storage.trackVisitor({
        userId: validatedData.userId,
        page: validatedData.page,
        referrer: validatedData.referrer,
        userAgent,
        ip,
      });

      const processingTime = Date.now() - startTime;

      res.json({
        status: "success",
        message: "Visitor tracked successfully",
        visitor_id: visitor.id,
        metadata: {
          processing_time: `${processingTime}ms`
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: "error",
          message: "Invalid request data",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error"
        });
      }
    }
  });

  // Get visitor counts
  app.get("/api/visitors/count", async (req, res) => {
    try {
      const startTime = Date.now();
      const period = req.query.period as string;
      
      // Validate period parameter
      const validPeriods = ['today', 'week', 'month', 'year', 'all'];
      if (period && !validPeriods.includes(period)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid period parameter. Must be one of: today, week, month, year, all"
        });
      }

      const requestedPeriod = period === 'all' ? undefined : period as 'today' | 'week' | 'month' | 'year';
      const counts = await storage.getVisitorCounts(requestedPeriod);
      const processingTime = Date.now() - startTime;

      res.json({
        status: "success",
        timestamp: new Date().toISOString(),
        data: counts,
        metadata: {
          endpoint: "/api/visitors/count",
          period: period || "all",
          processing_time: `${processingTime}ms`
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal server error"
      });
    }
  });

  // Get all visitors (for debugging/admin purposes)
  app.get("/api/visitors/all", async (req, res) => {
    try {
      const visitors = await storage.getAllVisitors();
      res.json({
        status: "success",
        data: visitors,
        count: visitors.length
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal server error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
