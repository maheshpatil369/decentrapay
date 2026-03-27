import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import txRoutes from "./routes/transactions.js";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/decentrapay");

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/tx", txRoutes);

app.listen(5000, () => console.log("Server running on 5000"));