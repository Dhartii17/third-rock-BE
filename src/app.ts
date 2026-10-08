import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./config/cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "20kb" }));
app.use("/api", routes);
app.use(errorHandler);
export default app;
