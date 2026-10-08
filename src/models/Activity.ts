import mongoose, { Document, Schema } from "mongoose";
import { TaskStatus } from "../types";

export type ActivityAction = "taskCreated" | "taskStatusChanged";

export interface IActivity extends Document {
  taskId: mongoose.Types.ObjectId;
  action: ActivityAction;
  previousStatus?: TaskStatus | null;
  currentStatus: TaskStatus;
  timestamp: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    action: { type: String, enum: ["taskCreated", "taskStatusChanged"], required: true, index: true },
    previousStatus: { type: String, enum: ["todo", "in-progress", "done"], default: null },
    currentStatus: { type: String, enum: ["todo", "in-progress", "done"], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export const ActivityModel = mongoose.model<IActivity>("Activity", activitySchema);
