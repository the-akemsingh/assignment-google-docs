// src/middleware/docAccess.ts
import { Request, Response, NextFunction } from "express";
import { NotFoundError, ForbiddenError } from "../types/errors";
import { getDocumentById } from "../services/documents.service";
import { hasShareAccess } from "../services/shares.service";
import { Document } from "../types/express";

/**
 * Middleware that loads a document and ensures the authenticated user has
 * either ownership or a share entry. Attaches `req.doc` and `req.isOwner`.
 */
export const requireDocAccess = async (req: Request, _res: Response, next: NextFunction) => {
  const docId = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) {
    // Should never happen because requireAuth runs before this router
    throw new ForbiddenError("User not authenticated");
  }

  const doc = await getDocumentById(docId);
  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  if (doc.owner_id === userId) {
    req.doc = doc as Document;
    req.isOwner = true;
    return next();
  }

  const hasAccess = await hasShareAccess(docId, userId);
  if (!hasAccess) {
    throw new ForbiddenError("Access denied to document");
  }

  req.doc = doc as Document;
  req.isOwner = false;
  return next();
};
