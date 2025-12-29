import { useEffect, useState } from "react";
import './App.css';


const VALID_COURSES = [
  "Full Stack Development","Front-End Development","Back-End Development",
  "AI/Machine Learning","Data Analyst","Data Science","DevOps",
  "Cloud Computing","Cybersecurity","Mobile App Development",
  "UI/UX Design","Blockchain Development","Big Data",
  "Internet of Things","Business Intelligence"
];

const API_URL = `${process.env.REACT_APP_API_URL}/students`;


export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", age: "", course: "" });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    const res = await fetch(API_URL);
    setStudents(await res.json());
  }

  function validate() {
    const err = {};
    if (!form.name || form.name.length < 3) err.name = "Name ≥ 3 chars required";
    if (!Number.isInteger(+form.age) || form.age < 18 || form.age > 100)
      err.age = "Age 18–100 required";
    if (!VALID_COURSES.some(c => c.toLowerCase() === form.course.toLowerCase()))
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

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    resetForm();
    fetchStudents();
  }

  function resetForm() {
    setForm({ name: "", age: "", course: "" });
    setEditId(null);
    setErrors({});
  }

  async function deleteStudent(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchStudents();
  }

  function startEdit(s) {
    setForm({ name: s.name, age: s.age, course: s.course });
    setEditId(s.id);
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
            className={errors.name ? "inline-error" : form.name ? "inline-success" : ""}
          />

          <input
            type="number"
            placeholder={errors.age || "Age (18-100)"}
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
            className={errors.age ? "inline-error" : form.age ? "inline-success" : ""}
          />

          <input
            placeholder={errors.course || "Course"}
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
            className={errors.course ? "inline-error" : form.course ? "inline-success" : ""}
          />

          <button id="submitBtn">
            {editId ? "Update Student" : "Add Student"}
          </button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Age</th><th>Course</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan="4">No students available</td></tr>
            )}
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.age}</td>
                <td>{s.course}</td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => startEdit(s)}>Edit</button>
                  <button className="del-btn" onClick={() => deleteStudent(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
