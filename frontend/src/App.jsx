import { useEffect, useState } from "react";
import "./App.css";

const VALID_COURSES = [
  "Full Stack Development",
  "Front-End Development",
  "Back-End Development",
  "AI/Machine Learning",
  "Data Analyst",
  "Data Science",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Mobile App Development",
  "UI/UX Design",
  "Blockchain Development",
  "Big Data",
  "Internet of Things",
  "Business Intelligence"
];

// Backend URL from .env (CRA way)
const API_URL = `${process.env.REACT_APP_API_URL}/students`;

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", age: "", course: "" });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  }

  function validate() {
    const err = {};

    if (!form.name || form.name.trim().length < 3)
      err.name = "Name must be at least 3 characters";

    if (!Number.isInteger(+form.age) || form.age < 18 || form.age > 100)
      err.age = "Age must be between 18 and 100";

    if (
      !VALID_COURSES.some(
        c => c.toLowerCase() === form.course.toLowerCase()
      )
    )
      err.course = "Invalid course";

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      course: VALID_COURSES.find(
        c => c.toLowerCase() === form.course.toLowerCase()
      )
    };

    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API_URL}/${editId}` : API_URL;

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      resetForm();
      fetchStudents();
    } catch (err) {
      console.error("Submit failed", err);
    }
  }

  function resetForm() {
    setForm({ name: "", age: "", course: "" });
    setEditId(null);
    setErrors({});
  }

  async function deleteStudent(id) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  function startEdit(student) {
    setForm({
      name: student.name,
      age: student.age,
      course: student.course
    });
    setEditId(student._id); // ✅ FIXED
  }

  return (
    <>
      <div className="card">
        <h2>Student Management System</h2>

        <form onSubmit={handleSubmit} noValidate>
          <input
            placeholder={errors.name || "Name"}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className={errors.name ? "inline-error" : ""}
          />

          <input
            type="number"
            placeholder={errors.age || "Age (18-100)"}
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
            className={errors.age ? "inline-error" : ""}
          />

          <input
            placeholder={errors.course || "Course"}
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
            className={errors.course ? "inline-error" : ""}
          />

          <button type="submit">
            {editId ? "Update Student" : "Add Student"}
          </button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Course</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan="4">No students available</td>
              </tr>
            )}

            {students.map(student => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.age}</td>
                <td>{student.course}</td>
                <td className="actions">
                  <button
                    className="edit-btn"
                    onClick={() => startEdit(student)}
                  >
                    Edit
                  </button>
                  <button
                    className="del-btn"
                    onClick={() => deleteStudent(student._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
