function toLocalInputValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export function InterviewForm({ interview, students, onSubmit, onCancel }) {
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
          <label htmlFor="interview-location">Work location / meeting link</label>
          <input
            id="interview-location"
            name="location"
            defaultValue={interview?.location || ""}
            placeholder="Optional"
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
        <label>Students participating</label>
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
                defaultChecked={interview?.student_ids?.includes(student.id)}
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
