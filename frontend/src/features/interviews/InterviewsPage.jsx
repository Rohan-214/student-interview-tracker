import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTracker } from "../../app/TrackerContext";
import { EmptyState, Modal } from "../../components/ui";
import { InterviewForm } from "./InterviewForm";

function readInterviewForm(form) {
  const fields = new FormData(form);
  return {
    company: fields.get("company").trim(),
    role: fields.get("role").trim(),
    scheduled_at: new Date(fields.get("scheduled_at")).toISOString(),
    mode: fields.get("mode"),
    location: fields.get("location") || null,
    notes: fields.get("notes") || null,
    student_ids: fields.getAll("student_ids").map(Number),
  };
}

function InterviewRow({ interview, past, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <div className="font-semibold">{interview.company}</div>
        <div className="mt-1 text-sm muted">{interview.role}</div>
      </td>
      <td>{new Date(interview.scheduled_at).toLocaleString()}</td>
      <td>{interview.mode}</td>
      <td className="align-top">
        <div className="flex items-center justify-between gap-2">
          {past && (
            <Link
              className="text-sm font-semibold text-indigo-700"
              to={`/interviews/${interview.id}`}
            >
              Attendance & results
            </Link>
          )}
          {!past && (
            <div className="flex items-center justify-end gap-1">
              <button
                title="Modify interview"
                aria-label={`Modify ${interview.company} interview`}
                className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => onEdit(interview)}
              >
                <Pencil size={16} />
              </button>
              <button
                title="Delete interview"
                aria-label={`Delete ${interview.company} interview`}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                onClick={() => onDelete(interview)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export function InterviewsPage() {
  const { interviews, students, request, refresh, setError, setNotice } =
    useTracker();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");
  const [editingInterview, setEditingInterview] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const now = Date.now();
  const upcomingInterviews = interviews
    .filter((interview) => new Date(interview.scheduled_at).getTime() >= now)
    .sort(
      (first, second) =>
        new Date(first.scheduled_at).getTime() -
        new Date(second.scheduled_at).getTime(),
    );
  const pastInterviews = interviews
    .filter((interview) => new Date(interview.scheduled_at).getTime() < now)
    .sort(
      (first, second) =>
        new Date(second.scheduled_at).getTime() -
        new Date(first.scheduled_at).getTime(),
    );

  function closeModal() {
    setModalOpen(false);
    setEditingInterview(null);
  }

  async function editInterview(interview) {
    try {
      const participants = await request(
        `/interviews/${interview.id}/participants`,
      );
      setEditingInterview({
        ...interview,
        student_ids: participants.map((participant) => participant.student_id),
      });
      setModalOpen(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveInterview(event) {
    event.preventDefault();
    const data = readInterviewForm(event.currentTarget);
    try {
      if (editingInterview) {
        await request(`/interviews/${editingInterview.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        setNotice("Interview updated successfully");
      } else {
        await request("/interviews", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setNotice("Interview schedule created");
      }
      closeModal();
      await refresh();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteInterview(interview) {
    if (!window.confirm("Delete this interview schedule?")) return;
    try {
      await request(`/interviews/${interview.id}`, { method: "DELETE" });
      setNotice("Interview deleted");
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
            <h2 className="font-bold">Interview schedules</h2>
            <p className="mt-1 text-sm muted">
              Create schedules and manage student outcomes.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-1 inline" size={16} /> Schedule interview
          </button>
        </div>
        {interviews.length ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Company / role</th>
                  <th>Date & time</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingInterviews.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan="4"
                        className="bg-slate-50 text-sm font-semibold text-slate-700"
                      >
                        Upcoming interviews
                      </td>
                    </tr>
                    {upcomingInterviews.map((interview) => (
                      <InterviewRow
                        key={interview.id}
                        interview={interview}
                        onEdit={editInterview}
                        onDelete={deleteInterview}
                      />
                    ))}
                  </>
                )}
                {pastInterviews.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan="4"
                        className="bg-slate-50 text-sm font-semibold text-slate-700"
                      >
                        Past interviews
                      </td>
                    </tr>
                    {pastInterviews.map((interview) => (
                      <InterviewRow
                        key={interview.id}
                        interview={interview}
                        past
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No interviews scheduled yet." />
        )}
      </section>

      {modalOpen && (
        <Modal
          title={editingInterview ? "Modify interview" : "Schedule an interview"}
          onClose={closeModal}
          wide
        >
          <InterviewForm
            key={editingInterview?.id || "new"}
            interview={editingInterview}
            students={students}
            onSubmit={saveInterview}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}
