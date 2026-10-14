import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTracker } from "../../app/TrackerContext";
import { EmptyState, StatusBadge } from "../../components/ui";

export function StudentHistoryPage() {
  const { studentId } = useParams();
  const { request, setError } = useTracker();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHistory(null);
    request(`/students/${studentId}/history`)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId, request, setError]);

  return (
    <>
      <Link
        className="mb-4 inline-block text-sm font-semibold text-indigo-700"
        to="/students"
      >
        ← Back to students
      </Link>
      {loading ? (
        <div className="card p-5 text-sm muted">Loading student history…</div>
      ) : !history ? (
        <div className="card p-5 text-sm muted">
          Student history could not be loaded.
        </div>
      ) : (
        <>
          <section className="card mb-5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-indigo-50 p-3 text-indigo-700">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{history.student.name}</h2>
                <p className="text-sm muted">
                  {history.student.email || "No email"} ·{" "}
                  {history.student.course}
                </p>
              </div>
            </div>
          </section>
          <section className="card overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-bold">Interview history</h2>
            </div>
            {history.history.length ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Company / role</th>
                      <th>Date</th>
                      <th>Attendance</th>
                      <th>Result</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.history.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-semibold">{item.company}</div>
                          <div className="text-sm muted">{item.role}</div>
                        </td>
                        <td>
                          {new Date(item.scheduled_at).toLocaleDateString()}
                        </td>
                        <td>
                          <StatusBadge value={item.attendance} />
                        </td>
                        <td>
                          <StatusBadge value={item.result} />
                        </td>
                        <td className="max-w-xs whitespace-pre-wrap">
                          {item.feedback || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No interview history for this student yet." />
            )}
          </section>
        </>
      )}
    </>
  );
}
