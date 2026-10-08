import { Server } from "socket.io";
let io: Server | null = null;

export const initializeSocket = (server: Server) => {
  io = server;
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
  });
};

export const emitTaskCreated = (task: unknown) => io?.emit("taskCreated", task);
export const emitTaskUpdated = (task: unknown) => io?.emit("taskUpdated", task);
export const emitActivityCreated = (activity: unknown) => io?.emit("activityCreated", activity);
