import { Types } from "mongoose";
import { TaskModel } from "../models/Task";
import { ActivityModel } from "../models/Activity";
import { AppError } from "../utils/AppError";
import { TaskStatus } from "../types";
import { emitActivityCreated, emitTaskCreated, emitTaskUpdated } from "../sockets";

const validStatuses: TaskStatus[] = ["todo", "in-progress", "done"];

const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) throw new AppError(400, "Tags must be an array of strings");
  return [...new Set(tags.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
};

export const createTask = async (input: { title: string; description?: string; status?: TaskStatus; tags?: string[]; createdBy: string }) => {
  const createdBy = String(input.createdBy ?? "").trim();
  if (!createdBy) throw new AppError(400, "Creator identity is required");
  if (createdBy.length > 100) throw new AppError(400, "Creator identity is too long");
  const title = String(input.title ?? "").trim();
  if (!title) throw new AppError(400, "Title is required");
  if (title.length > 200) throw new AppError(400, "Title cannot exceed 200 characters");
  const status = input.status ?? "todo";
  if (!validStatuses.includes(status)) throw new AppError(400, "Invalid status");

  const task = await TaskModel.create({
    title,
    description: String(input.description ?? "").trim(),
    status,
    tags: normalizeTags(input.tags ?? []),
    createdBy,
  });

  const activity = await ActivityModel.create({
    taskId: task._id,
    action: "taskCreated",
    previousStatus: null,
    currentStatus: task.status,
  });
  emitTaskCreated(task);
  emitActivityCreated({ ...activity.toObject(), task });
  return task;
};

export const getTasks = async (query: { page?: string; limit?: string; search?: string; status?: TaskStatus; tag?: string }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const filter: Record<string, unknown> = {};
  if (query.status) {
    if (!validStatuses.includes(query.status)) throw new AppError(400, "Invalid status");
    filter.status = query.status;
  }
  if (query.tag?.trim()) filter.tags = query.tag.trim().toLowerCase();
  if (query.search?.trim()) filter.$or = [
    { title: { $regex: query.search.trim(), $options: "i" } },
    { description: { $regex: query.search.trim(), $options: "i" } },
    { tags: { $regex: query.search.trim(), $options: "i" } },
  ];

  const [tasks, total] = await Promise.all([
    TaskModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    TaskModel.countDocuments(filter),
  ]);
  return { tasks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus, requesterId: string) => {
  if (!Types.ObjectId.isValid(taskId)) throw new AppError(400, "Invalid task ID");
  const normalizedRequesterId = String(requesterId ?? "").trim();
  if (!normalizedRequesterId) throw new AppError(401, "Creator identity is required");
  if (!validStatuses.includes(status)) throw new AppError(400, "Invalid status");

  const existing = await TaskModel.findById(taskId).lean();
  if (!existing) throw new AppError(404, "Task not found");
  if (existing.createdBy !== normalizedRequesterId) {
    throw new AppError(403, "Only the user who created this task can update it");
  }

  // Do not create a duplicate history entry when the status is unchanged.
  if (existing.status === status) return existing;

  const task = await TaskModel.findByIdAndUpdate(taskId, { status }, { new: true, runValidators: true }).lean();
  if (!task) throw new AppError(404, "Task not found");

  // Every status update is tracked as an activity. The socket events are emitted
  // only after MongoDB has successfully saved both records.
  const activity = await ActivityModel.create({
    taskId: task._id,
    action: "taskStatusChanged",
    previousStatus: existing.status,
    currentStatus: task.status,
  });
  emitTaskUpdated(task);
  emitActivityCreated({ ...activity.toObject(), task });
  return task;
};

export const getActivities = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  action?: string;
}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const filter: Record<string, unknown> = {};

  if (query.action === "taskCreated" || query.action === "taskStatusChanged") {
    filter.action = query.action;
  } else if (query.action?.trim()) {
    throw new AppError(400, "Invalid activity action");
  }

  // Search is applied to the related task title/description/tags.
  // Resolve matching task IDs first so pagination stays on activities.
  if (query.search?.trim()) {
    const term = query.search.trim();
    const matchingTasks = await TaskModel.find({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { tags: { $regex: term, $options: "i" } },
      ],
    }).select("_id").lean();
    filter.taskId = { $in: matchingTasks.map((task) => task._id) };
  }

  const [activities, total] = await Promise.all([
    ActivityModel.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("taskId", "title description status tags")
      .lean(),
    ActivityModel.countDocuments(filter),
  ]);

  const normalized = activities.map((activity: any) => ({
    _id: activity._id,
    taskId: activity.taskId?._id ?? activity.taskId,
    action: activity.action,
    previousStatus: activity.previousStatus ?? null,
    currentStatus: activity.currentStatus,
    timestamp: activity.timestamp,
    task: activity.taskId,
  }));

  return {
    activities: normalized,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getTaskHistory = async (taskId: string) => {
  if (!Types.ObjectId.isValid(taskId)) throw new AppError(400, "Invalid task ID");

  const task = await TaskModel.findById(taskId).select("_id title description status tags").lean();
  if (!task) throw new AppError(404, "Task not found");

  const activities = await ActivityModel.find({ taskId })
    .sort({ timestamp: -1 })
    .lean();

  return {
    task,
    history: activities.map((activity) => ({
      _id: activity._id,
      action: activity.action,
      previousStatus: activity.previousStatus ?? null,
      currentStatus: activity.currentStatus,
      timestamp: activity.timestamp,
    })),
  };
};

export const getStats = async () => {
  const [totalTasks, statusCounts, tagCounts] = await Promise.all([
    TaskModel.countDocuments(),
    TaskModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    TaskModel.aggregate([{ $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 1 }]),
  ]);
  const byStatus = { todo: 0, "in-progress": 0, done: 0 };
  for (const row of statusCounts) if (row._id in byStatus) byStatus[row._id as TaskStatus] = row.count;
  return { totalTasks, byStatus, mostCommonTag: tagCounts[0]?._id ?? null };
};
