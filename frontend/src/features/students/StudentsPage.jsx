import { useEffect, useMemo, useState } from "react";
import { History, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTracker } from "../../app/TrackerContext";
import { EmptyState, Modal } from "../../components/ui";
import { StudentForm } from "./StudentForm";

function readStudentForm(form) {
  const fields = new FormData(form);
  return {
    name: fields.get("name").trim(),
    email: fields.get("email") || null,
    phone: fields.get("phone") || null,
    course: fields.get("course") || "Data Analytics",
  };
}

export function StudentsPage() {
  const { students, request, refresh, setError, setNotice } = useTracker();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredStudents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return students.filter((student) =>
      `${student.name} ${student.email || ""}`.toLowerCase().includes(search),
    );
  }, [students, query]);

  function closeModal() {
    setModalOpen(false);
    setEditingStudent(null);
  }

  async function saveStudent(event) {
    event.preventDefault();
    const data = readStudentForm(event.currentTarget);
    try {
      if (editingStudent) {
        await request(`/api/students/${editingStudent.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        setNotice("Student updated successfully");
      } else {
        await request("/api/students", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setNotice("Student added successfully");
      }
      closeModal();
      await refresh();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm("Delete this student?")) return;
    try {
      await request(`/api/students/${student.id}`, { method: "DELETE" });
      setNotice("Student deleted");
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-bold">Students</h2>
            <p className="mt-1 text-sm muted">
              Manage the students in your training batch.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-1 inline" size={16} /> Add student
          </button>
        </div>
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="pl-9"
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {filteredStudents.length ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Course</th>
                  <th>History</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs muted">Student #{student.id}</div>
                    </td>
                    <td>
                      <div>{student.email || "—"}</div>
                      <div className="text-sm muted">{student.phone || ""}</div>
                    </td>
                    <td>{student.course}</td>
                    <td>
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          className="text-sm font-semibold text-indigo-700"
                          to={`/students/${student.id}/history`}
                        >
                          <History className="mr-1 inline" size={15} /> View
                          history
                        </Link>
                        <div className="flex items-center gap-1">
                          <button
                            title="Modify student"
                            aria-label={`Modify ${student.name}`}
                            className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => {
                              setEditingStudent(student);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            title="Delete student"
                            aria-label={`Delete ${student.name}`}
                            className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteStudent(student)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            text={
              query
                ? "No students match your search."
                : "No students yet. Add your first student."
            }
          />
        )}
      </section>

      {modalOpen && (
        <Modal
          title={editingStudent ? "Modify student" : "Add student"}
          onClose={closeModal}
        >
          <StudentForm
            key={editingStudent?.id || "new"}
            student={editingStudent}
            onSubmit={saveStudent}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}
