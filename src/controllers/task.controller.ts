import { Response } from "express";
import { createTask as createTaskService, getTasks as getTasksService, updateTaskStatus as updateTaskStatusService, getActivities as getActivitiesService, getTaskHistory as getTaskHistoryService, getStats as getStatsService } from "../services/task.service";

export const createTask = async (req: any, res: Response) => {
  const task = await createTaskService({ ...req.body, createdBy: req.header("x-user-id") ?? "" });
  res.status(201).json({ success: true, data: task });
};

export const getTasks = async (req: any, res: Response) => {
  const result = await getTasksService(req.query);
  res.json({ success: true, data: result.tasks, pagination: result.pagination });
};

export const updateTaskStatus = async (req: any, res: Response) => {
  const task = await updateTaskStatusService(req.params.id, req.body.status, req.header("x-user-id") ?? "");
  res.json({ success: true, data: task });
};

export const getActivities = async (req: any, res: Response) => {
  const result = await getActivitiesService(req.query);
  res.json({ success: true, data: result.activities, pagination: result.pagination });
};

export const getTaskHistory = async (req: any, res: Response) => {
  const result = await getTaskHistoryService(req.params.id);
  res.json({ success: true, data: result });
};

export const getStats = async (_req: any, res: Response) => {
  const stats = await getStatsService();
  res.json({ success: true, data: stats });
};
