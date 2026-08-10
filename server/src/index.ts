import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { memesRouter } from "./routes/memes.js";
import { categoriesRouter } from "./routes/categories.js";
import { uploadRouter, uploadsDir } from "./routes/upload.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/files", express.static(uploadsDir, { maxAge: "7d" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
app.use("/api/memes", memesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/upload", uploadRouter);

app.listen(PORT, () => {
  console.log(`[meme-server] listening on http://localhost:${PORT}`);
});
