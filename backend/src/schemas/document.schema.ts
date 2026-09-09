// src/schemas/document.schema.ts
import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
}).refine(data => data.title !== undefined || data.content !== undefined, {
  message: "At least one of 'title' or 'content' must be provided",
});
