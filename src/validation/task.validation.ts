import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["todo", "in-progress", "done"]),
});
