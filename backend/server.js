const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =====================
   MIDDLEWARE
===================== */
app.use(express.json());
app.use(helmet()); // Security headers
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use(limiter);

/* =====================
   MONGODB CONNECTION
===================== */
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));


/* =====================
   CLOUDINARY CONFIG
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* =====================
   STUDENT MODEL
===================== */
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});
const Student = mongoose.model("Student", studentSchema);

/* =====================
   MULTER SETUP
===================== */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else cb(new Error("Invalid file type. Only images/PDF allowed."));
  }
});

/* =====================
   ROUTES
===================== */

// Root
app.get("/", (req, res) => res.json({ message: "Backend running" }));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// Get all students
app.get("/students", async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// Create student + file upload
app.post("/students", upload.single("file"), [
  body("name").trim().isLength({ min: 3 }),
  body("age").isInt({ min: 18, max: 100 }),
  body("course").notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let fileUrl = null;
  if (req.file) {
    const result = await cloudinary.uploader.upload_stream({ resource_type: "auto" }, (err, res) => {
      if (err) throw err;
      return res.secure_url;
    }).end(req.file.buffer);
    fileUrl = result.secure_url;
  }

  const student = new Student({ ...req.body, fileUrl });
  await student.save();
  res.status(201).json(student);
});

// Update student
app.put("/students/:id", [
  body("name").trim().isLength({ min: 3 }),
  body("age").isInt({ min: 18, max: 100 }),
  body("course").notEmpty()
], async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  Object.assign(student, req.body, { updatedAt: new Date() });
  await student.save();
  res.json(student);
});

// Delete student
app.delete("/students/:id", async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await student.remove();
  res.json({ message: "Deleted" });
});

/* =====================
   GLOBAL ERROR HANDLER
===================== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

/* =====================
   START SERVER
===================== */
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
