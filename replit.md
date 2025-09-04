# Overview

This is a full-stack web application built with React (frontend) and Express.js (backend) that provides visitor tracking and analytics functionality. The application uses a modern tech stack with TypeScript, TailwindCSS, and shadcn/ui components for the frontend, while the backend implements a REST API for visitor data management. The system is designed to track page visits, user interactions, and provide analytics dashboards with real-time data visualization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with TailwindCSS for styling
- **Form Handling**: React Hook Form with Zod validation
- **Component Structure**: Organized in a feature-based structure with reusable UI components

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Storage Layer**: JsonFileStorage implementation with file-based persistence
- **Storage Pattern**: Abstract storage interface (IStorage) with JSON file and in-memory implementations
- **API Design**: RESTful endpoints for visitor tracking and analytics data retrieval
- **Middleware**: Custom logging middleware for API request monitoring

## Data Storage Solutions
- **Primary Storage**: JSON file-based storage system using JsonFileStorage class
- **Storage Location**: All data is stored in `data/visitors_data.json` file
- **Schema Management**: Shared schema definitions between frontend and backend using Zod
- **Data Persistence**: Automatic file-based persistence with atomic write operations

## Data Schema
- **Users Data**: Basic user management stored as key-value pairs in JSON format
- **Visitors Data**: Comprehensive visitor tracking including page visits, referrers, user agents, IP addresses, and timestamps
- **Analytics Support**: In-memory processing of JSON data for time-based analytics and visitor count aggregations

## API Structure
- **Visitor Tracking**: POST `/api/visitors/track` - Records visitor interactions with validation
- **Analytics Endpoints**: GET `/api/visitors/count` - Retrieves visitor statistics with optional time period filtering
- **Error Handling**: Centralized error handling with structured JSON responses
- **Request Logging**: Detailed logging of API requests with response times and payload capture

## Authentication and Authorization
- **Session-based Authentication**: Express sessions with PostgreSQL storage backend
- **Password Security**: Basic password hashing (implementation ready for bcrypt integration)
- **User Management**: Simple user registration and authentication system

# External Dependencies

## Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: TailwindCSS for utility-first styling with custom design tokens
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Charts**: Recharts integration for data visualization capabilities

## Backend Dependencies
- **File System**: Node.js built-in fs/promises for JSON file operations
- **Data Validation**: Zod for runtime type checking and data validation
- **Storage Pattern**: Abstract IStorage interface with JsonFileStorage implementation
- **Session Management**: In-memory session management suitable for single-instance applications

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript with strict configuration for both frontend and backend
- **Code Quality**: ESBuild for backend bundling and optimization
- **Development Environment**: Replit-specific plugins for enhanced development experience

## Third-party Integrations
- **Replit Platform**: Custom Vite plugins for Replit development environment integration
- **Font Loading**: Google Fonts integration for typography (DM Sans, Fira Code, Geist Mono)
- **Error Monitoring**: Runtime error overlay for development debugging