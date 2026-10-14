import { useState } from "react";

function toLocalInputValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export function InterviewForm({ interview, students, onSubmit, onCancel }) {
  const [selectedStudentIds, setSelectedStudentIds] = useState(
    () => new Set(interview?.student_ids || []),
  );
  const allStudentsSelected =
    students.length > 0 &&
    students.every((student) => selectedStudentIds.has(student.id));

  function toggleStudent(studentId) {
    setSelectedStudentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(studentId)) {
        nextIds.delete(studentId);
      } else {
        nextIds.add(studentId);
      }
      return nextIds;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="interview-company">Company name *</label>
          <input
            id="interview-company"
            name="company"
            defaultValue={interview?.company || ""}
            required
          />
        </div>
        <div>
          <label htmlFor="interview-role">Job role *</label>
          <input
            id="interview-role"
            name="role"
            defaultValue={interview?.role || ""}
            required
            placeholder="e.g. Junior Data Analyst"
          />
        </div>
        <div>
          <label htmlFor="interview-date">Date and time *</label>
          <input
            id="interview-date"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(interview?.scheduled_at)}
            required
          />
        </div>
        <div>
          <label htmlFor="interview-mode">Interview mode</label>
          <select
            id="interview-mode"
            name="mode"
            defaultValue={interview?.mode || "Online"}
          >
            <option>Online</option>
            <option>In-person</option>
            <option>Phone</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="interview-location">Interview location *</label>
          <input
            id="interview-location"
            name="location"
            defaultValue={interview?.location || ""}
            placeholder="e.g. Room 201 or online meeting link"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="interview-notes">Notes</label>
          <textarea
            id="interview-notes"
            name="notes"
            rows="2"
            defaultValue={interview?.notes || ""}
            placeholder="Rounds, documents to bring, etc."
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label>Students participating</label>
          {students.length > 0 && (
            <button
              type="button"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              onClick={() =>
                setSelectedStudentIds(
                  allStudentsSelected
                    ? new Set()
                    : new Set(students.map((student) => student.id)),
                )
              }
            >
              {allStudentsSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>
        <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 font-normal"
            >
              <input
                type="checkbox"
                name="student_ids"
                value={student.id}
                className="h-4 w-4"
                checked={selectedStudentIds.has(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              {student.name}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs muted">
          Select the students expected to attend. You can schedule without
          selecting students, but no attendance rows will be created.
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary">
          {interview ? "Save changes" : "Create schedule"}
        </button>
      </div>
    </form>
  );
}
