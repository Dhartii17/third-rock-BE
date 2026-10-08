import { Router } from "express";
import taskRoutes from "./task.routes";

const router = Router();
router.use("/tasks", taskRoutes);
router.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
export default router;
