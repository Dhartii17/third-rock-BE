import { Router } from "express";
import { createTask, getTasks, updateTaskStatus, getActivities, getTaskHistory, getStats } from "../controllers/task.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/", asyncHandler(createTask));
router.get("/", asyncHandler(getTasks));
router.patch("/:id/status", asyncHandler(updateTaskStatus));
router.get("/:id/history", asyncHandler(getTaskHistory));
router.get("/activities", asyncHandler(getActivities));
router.get("/stats", asyncHandler(getStats));

export default router;
