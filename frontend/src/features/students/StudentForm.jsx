export function StudentForm({ student, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="student-name">Full name *</label>
        <input
          id="student-name"
          name="name"
          defaultValue={student?.name || ""}
          required
          maxLength={140}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="student-email">Email</label>
        <input
          id="student-email"
          name="email"
          type="email"
          defaultValue={student?.email || ""}
        />
      </div>
      <div>
        <label htmlFor="student-phone">Phone</label>
        <input
          id="student-phone"
          name="phone"
          type="tel"
          defaultValue={student?.phone || ""}
        />
      </div>
      <div>
        <label htmlFor="student-course">Course</label>
        <input
          id="student-course"
          name="course"
          defaultValue={student?.course || "Data Analytics"}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary">
          {student ? "Save changes" : "Save student"}
        </button>
      </div>
    </form>
  );
}
