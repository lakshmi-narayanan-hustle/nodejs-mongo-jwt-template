// imports
import express from "express";
import cors from "cors";
import morgan from "morgan";
import * as dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import userRoutes from "./src/routes/userRoute.js";

// initialization

const app = express();
dotenv.config();

// connecting db

connectDB();

// middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// end points

app.use("/api/user", userRoutes);

app.listen(8001, () => {
  console.log("Server Is Listening On Port:8001");
});
