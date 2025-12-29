const express = require("express");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =====================
   MIDDLEWARE
===================== */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*", // FRONTEND_URL in .env
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

/* =====================
   ROOT ROUTE
===================== */
app.get("/", (req, res) => {
  res.json({
    message: "Student Management Backend API is running",
    endpoints: {
      health: "/health",
      students: "/students",
    },
  });
});

/* =====================
   IN-MEMORY DATA STORE
===================== */
let students = [];
let nextId = 1;

/* =====================
   VALIDATION RULES
===================== */
const studentValidation = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),
  body("age")
    .isInt({ min: 18, max: 100 })
    .withMessage("Age must be between 18 and 100"),
  body("course")
    .trim()
    .notEmpty()
    .withMessage("Course is required"),
];

/* =====================
   ROUTES
===================== */

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET all students
app.get("/students", (req, res) => res.json(students));

// GET single student
app.get("/students/:id", (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

// CREATE student
app.post("/students", studentValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, age, course } = req.body;
  const newStudent = { id: nextId++, name, age: Number(age), course, createdAt: new Date().toISOString() };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// UPDATE student
app.put("/students/:id", studentValidation, (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ message: "Student not found" });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, age, course } = req.body;
  student.name = name;
  student.age = Number(age);
  student.course = course;
  student.updatedAt = new Date().toISOString();

  res.json(student);
});

// DELETE student
app.delete("/students/:id", (req, res) => {
  const index = students.findIndex(s => s.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Student not found" });

  students.splice(index, 1);
  res.json({ message: "Student deleted" });
});

/* =====================
   GLOBAL ERROR HANDLER
===================== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

/* =====================
   START SERVER
===================== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
