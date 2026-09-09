// src/schemas/share.schema.ts
import { z } from "zod";

export const shareSchema = z.object({
  email: z.string().email(),
});
