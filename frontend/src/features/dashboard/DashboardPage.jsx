import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Plus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTracker } from "../../app/TrackerContext";
import { EmptyState } from "../../components/ui";

export function DashboardPage() {
  const { dashboard } = useTracker();
  const summaryCards = [
    [Users, "Students", dashboard?.students ?? "—", "In this batch"],
    [
      CalendarDays,
      "Interviews",
      dashboard?.interviews ?? "—",
      "Schedules created",
    ],
    [
      CheckCircle2,
      "Selected",
      dashboard?.selected ?? "—",
      "Across all interviews",
    ],
    [
      Clock3,
      "Awaiting result",
      dashboard?.pending ?? "—",
      "Pending outcomes",
    ],
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([Icon, label, value, description]) => (
          <div className="card p-5" key={label}>
            <div className="flex items-center justify-between">
              <span className="text-sm muted">{label}</span>
              <Icon size={19} className="text-indigo-600" />
            </div>
            <div className="mt-4 text-3xl font-bold">{value}</div>
            <div className="mt-1 text-xs muted">{description}</div>
          </div>
        ))}
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-bold">Upcoming interviews</h2>
            <p className="mt-1 text-sm muted">
              Your next scheduled opportunities
            </p>
          </div>
          <Link className="btn btn-secondary" to="/interviews">
            All interviews <ChevronRight className="inline" size={15} />
          </Link>
        </div>
        {dashboard?.upcoming?.length ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Company / role</th>
                  <th>Date & time</th>
                  <th>Mode</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dashboard.upcoming.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      <div className="font-semibold">{interview.company}</div>
                      <div className="mt-1 text-sm muted">{interview.role}</div>
                    </td>
                    <td>{new Date(interview.scheduled_at).toLocaleString()}</td>
                    <td>{interview.mode}</td>
                    <td>
                      <Link
                        className="text-sm font-semibold text-indigo-700"
                        to={`/interviews/${interview.id}`}
                      >
                        Manage results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No upcoming interviews. Add an interview schedule to get started." />
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/students?new=1" className="btn btn-primary">
              <Plus className="mr-1 inline" size={16} /> Add student
            </Link>
            <Link to="/interviews?new=1" className="btn btn-secondary">
              <Plus className="mr-1 inline" size={16} /> Schedule interview
            </Link>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Outcome summary</h2>
          <div className="mt-4 flex gap-5 text-sm">
            <span>
              <b className="text-green-700">{dashboard?.selected ?? 0}</b>{" "}
              selected
            </span>
            <span>
              <b className="text-red-700">{dashboard?.rejected ?? 0}</b>{" "}
              rejected
            </span>
            <span>
              <b className="text-amber-700">{dashboard?.pending ?? 0}</b>{" "}
              pending
            </span>
          </div>
          <div className="mt-3 text-xs muted">
            Results are counted per interview attempt, so a student can appear
            more than once.
          </div>
        </section>
      </div>
    </>
  );
}
