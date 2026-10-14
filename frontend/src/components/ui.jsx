import { BriefcaseBusiness, X } from "lucide-react";
import { useState } from "react";

export function EmptyState({ text }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <BriefcaseBusiness size={20} />
      </div>
      <p className="text-sm muted">{text}</p>
    </div>
  );
}

export function StatusBadge({ value }) {
  const className =
    value === "Selected" || value === "Present"
      ? "pill-green"
      : value === "Rejected" || value === "Absent"
        ? "pill-red"
        : value === "Pending"
          ? "pill-amber"
          : "pill-gray";

  return <span className={`pill ${className}`}>{value}</span>;
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto w-full rounded-2xl bg-white p-6 shadow-xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

const ABSENT_INTERVIEW_FEEDBACK = "Student did not attend the interview.";

export function ParticipantEditor({ participant, onSave }) {
  const [attendance, setAttendance] = useState(participant.attendance);
  const [result, setResult] = useState(
    participant.attendance === "Absent" ? "Rejected" : participant.result,
  );
  const [feedback, setFeedback] = useState(
    participant.attendance === "Absent"
      ? ABSENT_INTERVIEW_FEEDBACK
      : participant.feedback || "",
  );
  const [compensation, setCompensation] = useState(
    participant.compensation || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (result === "Rejected" && !feedback.trim()) {
      setError("Feedback is required for a rejection.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(participant, { attendance, result, feedback, compensation });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 p-5 lg:grid-cols-[1.1fr_.8fr_.8fr_1.6fr_auto] lg:items-end"
    >
      <div>
        <div className="font-semibold">{participant.student_name}</div>
        <div className="mt-1 text-xs muted">Participant #{participant.id}</div>
      </div>
      <div>
        <label>Attendance</label>
        <select
          value={attendance}
          onChange={(event) => {
            const nextAttendance = event.target.value;
            setAttendance(nextAttendance);
            if (nextAttendance === "Absent") {
              setResult("Rejected");
              setFeedback(ABSENT_INTERVIEW_FEEDBACK);
            }
          }}
        >
          <option>Not marked</option>
          <option>Present</option>
          <option>Absent</option>
        </select>
      </div>
      <div>
        <label>Interview result</label>
        <select
          value={result}
          disabled={attendance === "Absent"}
          onChange={(event) => setResult(event.target.value)}
        >
          <option>Pending</option>
          <option>Selected</option>
          <option>Rejected</option>
        </select>
      </div>
      <div>
        {result === "Selected" ? (
          <>
            <label>Salary / stipend</label>
            <input
              value={compensation}
              onChange={(event) => setCompensation(event.target.value)}
              maxLength={120}
              placeholder="e.g. ₹6 LPA or ₹25,000/month"
            />
          </>
        ) : (
          <>
            <label>
              {result === "Rejected"
                ? "Feedback (required)"
                : "Feedback / notes"}
            </label>
            <textarea
              rows="2"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              readOnly={attendance === "Absent"}
              placeholder={
                result === "Rejected"
                  ? "Explain what the student should improve…"
                  : "Optional notes"
              }
              required={result === "Rejected"}
            />
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700 lg:col-span-4">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
