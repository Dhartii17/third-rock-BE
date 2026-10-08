import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { initializeSocket } from "./sockets";

const startServer = async () => {
  await connectDatabase();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: env.clientUrl === "*" ? true : env.clientUrl } });
  initializeSocket(io);
  httpServer.listen(env.port, () => console.log(`Server running on port ${env.port}`));
};
startServer().catch((error) => { console.error(error); process.exit(1); });
