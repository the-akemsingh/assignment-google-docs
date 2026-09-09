// src/routes/documents.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireDocAccess } from "../middleware/docAccess";
import {
  createDocument,
  getDocumentById,
  listDocumentsForUser,
  updateDocument,
  deleteDocument,
} from "../services/documents.service";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../schemas/document.schema";
import { shareSchema } from "../schemas/share.schema";
import { NotFoundError, ForbiddenError } from "../types/errors";
import { findUserByEmail } from "../services/auth.service";
import {
  createShare,
  listSharesForDocument,
  deleteShare,
} from "../services/shares.service";

import multer from "multer";
import path from "path";
import { BadRequestError } from "../types/errors";
import { parseTxtToTiptapJson, parseMarkdownToTiptapJson, uploadRawFile, recordImport } from "../services/import.service";

// Multer configuration for .txt and .md uploads (2 MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype === "text/plain" ||
      file.mimetype === "text/markdown" ||
      file.originalname.toLowerCase().endsWith('.txt') ||
      file.originalname.toLowerCase().endsWith('.md');
    cb(null, isAllowed);
  },
});

const router = Router();

// Apply authentication to all document routes
router.use(requireAuth);

// POST /documents/import – import .txt or .md file (auth applied, before :id routes)
router.post("/import", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file provided");
    }
    const file = req.file;
    const text = file.buffer.toString("utf-8");
    let content;
    const ext = path.parse(file.originalname).ext.toLowerCase();
    if (ext === ".txt" || file.mimetype === "text/plain") {
      content = parseTxtToTiptapJson(text);
    } else if (ext === ".md" || file.mimetype === "text/markdown") {
      content = parseMarkdownToTiptapJson(text);
    } else {
      // Should not happen due to multer filter, but fallback
      throw new BadRequestError("Unsupported file type");
    }
    const title = path.parse(file.originalname).name;
    // Create document with title and content
    const doc = await createDocument(req.user!.id, title);
    await updateDocument(doc.id, { content });
    const savedDoc = await getDocumentById(doc.id);
    const storagePath = await uploadRawFile(req.user!.id, file.originalname, file.buffer);
    await recordImport(doc.id, req.user!.id, file.originalname, storagePath, file.mimetype, file.size);
    res.status(200).json({ data: savedDoc });
  } catch (err) {
    next(err);
  }
});

// POST /documents – create a new document
router.post("/", async (req, res, next) => {
  try {
    const { title } = createDocumentSchema.parse(req.body);
    const doc = await createDocument(req.user!.id, title);
    res.status(200).json({ data: doc });
  } catch (err) {
    next(err);
  }
});

// GET /documents – list owned and shared docs for the user
router.get("/", async (req, res, next) => {
  try {
    const result = await listDocumentsForUser(req.user!.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /documents/:id – get a single document (access‑controlled)
router.get("/:id", requireDocAccess, async (req, res, next) => {
  try {
    res.status(200).json({ data: (req as any).doc });
  } catch (err) {
    next(err);
  }
});

// PATCH /documents/:id – update title/content (access‑controlled)
router.patch("/:id", requireDocAccess, async (req, res, next) => {
  try {
    const raw = updateDocumentSchema.parse(req.body);
    const updates: { title?: string; content?: any } = {};
    if (raw.title !== undefined) updates.title = raw.title;
    if (raw.content !== undefined) updates.content = raw.content;
    const updated = await updateDocument(req.params.id as string, updates);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /documents/:id – delete (owner only)
router.delete("/:id", requireDocAccess, async (req, res, next) => {
  try {
    if (!(req as any).isOwner) {
      throw new ForbiddenError("Only the owner can delete a document");
    }
    const deleted = await deleteDocument(req.params.id as string);
    res.status(200).json({ data: { id: deleted.id } });
  } catch (err) {
    next(err);
  }
});

// ---------- Sharing routes ----------
// POST /documents/:id/share – share with another user (owner only)
router.post("/:id/share", requireDocAccess, async (req, res, next) => {
  try {
    if (!(req as any).isOwner) {
      throw new ForbiddenError("Only the owner can share a document");
    }
    const { email } = shareSchema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const shared = await createShare(req.params.id as string, user.id);
    // Return the shared user info
    res.status(200).json({ data: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

// GET /documents/:id/shares – list users the document is shared with (owner only)
router.get("/:id/shares", requireDocAccess, async (req, res, next) => {
  try {
    if (!(req as any).isOwner) {
      throw new ForbiddenError("Only the owner can list shares");
    }
    const shares = await listSharesForDocument(req.params.id as string);
    res.status(200).json({ data: shares });
  } catch (err) {
    next(err);
  }
});

// DELETE /documents/:id/share/:userId – revoke a share (owner only)
router.delete("/:id/share/:userId", requireDocAccess, async (req, res, next) => {
  try {
    if (!(req as any).isOwner) {
      throw new ForbiddenError("Only the owner can delete a share");
    }
    await deleteShare(req.params.id as string, req.params.userId as string);
    res.status(200).json({ data: { userId: req.params.userId } });
  } catch (err) {
    next(err);
  }
});

export default router;
