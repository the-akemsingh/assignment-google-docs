// src/routes/auth.routes.ts
import { Router } from "express";
import { loginSchema } from "../schemas/auth.schema";
import { findUserByEmail, signToken } from "../services/auth.service";
import { NotFoundError } from "../types/errors";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    // Validate request body – let Zod errors bubble to error handler
    const { email } = loginSchema.parse(req.body);

    const user = await findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const token = signToken(user);
    res.status(200).json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
