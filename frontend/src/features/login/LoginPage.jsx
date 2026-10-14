import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";

export function LoginPage() {
  const { token, signIn } = useAuth();
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    username: "teacher",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) {
    return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(credentials);
    } catch (signInError) {
      setError(signInError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <GraduationCap size={25} />
        </div>
        <p className="text-sm font-semibold text-indigo-700">TRAINING CENTER</p>
        <h1 className="mt-2 text-2xl font-bold">Teacher sign in</h1>
        <p className="mt-2 text-sm muted">
          Manage interviews, attendance and student outcomes.
        </p>
        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              required
              autoComplete="current-password"
            />
          </div>
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="mt-5 text-xs muted">
          Initial credentials are set in the backend .env file. Change the
          default password before using real student data.
        </p>
      </form>
    </div>
  );
}
