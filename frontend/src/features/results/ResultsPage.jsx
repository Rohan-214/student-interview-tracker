import { useTracker } from "../../app/TrackerContext";
import { EmptyState } from "../../components/ui";

export function ResultsPage() {
  const { results } = useTracker();

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Selected students</h2>
            <p className="mt-1 text-sm muted">
              Students selected across all interview schedules.
            </p>
          </div>
          <div className="rounded-xl bg-green-50 px-5 py-3 text-center text-green-800">
            <div className="text-3xl font-bold">{results.selected_count}</div>
            <div className="text-xs font-semibold">students selected</div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">Selection details</h2>
        </div>
        {results.selections.length ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company / role</th>
                  <th>Job location</th>
                  <th>Salary / stipend</th>
                </tr>
              </thead>
              <tbody>
                {results.selections.map((selection) => (
                  <tr key={selection.id}>
                    <td className="font-semibold">{selection.student_name}</td>
                    <td>
                      <div className="font-semibold">{selection.company}</div>
                      <div className="mt-1 text-sm muted">
                        {selection.role}
                      </div>
                    </td>
                    <td>{selection.work_location || "Not provided"}</td>
                    <td>{selection.compensation || "Not provided"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No students have been marked as selected yet." />
        )}
      </section>
    </div>
  );
}
