import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTracker } from "../../app/TrackerContext";
import { EmptyState, ParticipantEditor } from "../../components/ui";

export function InterviewDetailsPage() {
  const { interviewId } = useParams();
  const { interviews, request, refresh, setError, setNotice } = useTracker();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const interview = interviews.find((item) => item.id === Number(interviewId));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    request(`/interviews/${interviewId}/participants`)
      .then((rows) => {
        if (active) setParticipants(rows);
      })
      .catch((requestError) => {
        if (active) {
          setLoadError(requestError.message);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [interviewId, request, setError]);

  async function saveParticipant(participant, form) {
    const data = {
      attendance: form.attendance,
      result: form.result,
      feedback: form.feedback,
      compensation: form.compensation,
      work_location: form.workLocation,
    };
    await request(`/participants/${participant.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setNotice("Interview result saved");
    setParticipants(await request(`/interviews/${interviewId}/participants`));
    await refresh();
  }

  return (
    <>
      <Link
        className="mb-4 inline-block text-sm font-semibold text-indigo-700"
        to="/interviews"
      >
        ← Back to interviews
      </Link>
      {interview && (
        <section className="card mb-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{interview.company}</h2>
              <p className="mt-1 text-sm muted">
                {interview.role} ·{" "}
                {new Date(interview.scheduled_at).toLocaleString()}
              </p>
            </div>
            <span className="pill pill-gray">{interview.mode}</span>
          </div>
          {interview.notes && (
            <p className="mt-3 text-sm">{interview.notes}</p>
          )}
        </section>
      )}
      <section className="card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">Participants</h2>
          <p className="mt-1 text-sm muted">
            Mark attendance and save results. Rejection requires feedback.
          </p>
        </div>
        {loading ? (
          <div className="p-5 text-sm muted">Loading participants…</div>
        ) : loadError ? (
          <div className="p-5 text-sm text-red-700">
            Participants could not be loaded.
          </div>
        ) : participants.length ? (
          <div className="divide-y">
            {participants.map((participant) => (
              <ParticipantEditor
                key={participant.id}
                participant={participant}
                onSave={saveParticipant}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No students were assigned to this interview. Edit the schedule or create another schedule with students selected." />
        )}
      </section>
    </>
  );
}
