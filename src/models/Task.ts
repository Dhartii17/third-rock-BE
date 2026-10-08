import mongoose, { Document, Schema } from "mongoose";
import { TaskStatus } from "../types";

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo", index: true },
    tags: { type: [String], default: [], index: true },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const TaskModel = mongoose.model<ITask>("Task", taskSchema);
