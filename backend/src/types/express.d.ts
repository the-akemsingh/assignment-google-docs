// src/types/express.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      doc?: Document;
      isOwner?: boolean;
    }
  }
}

// Export a User type for convenience in services
export interface User {
  id: string;
  email: string;
  name: string;
}

// Export a Document type for services and middleware
export interface Document {
  id: string;
  owner_id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}
