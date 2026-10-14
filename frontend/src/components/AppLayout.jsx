import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { useTracker } from "../app/TrackerContext";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Students", to: "/students", icon: Users },
  { label: "Interviews", to: "/interviews", icon: CalendarDays },
  { label: "Results", to: "/results", icon: Trophy },
];

function pageTitle(pathname) {
  if (pathname.startsWith("/students/")) return "Student history";
  if (pathname.startsWith("/interviews/")) return "Interview details";
  return navigation.find((item) => item.to === pathname)?.label || "Dashboard";
}

export function AppLayout() {
  const { username, logout } = useAuth();
  const {
    error,
    notice,
    refresh,
    clearError,
    clearNotice,
  } = useTracker();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitle(location.pathname);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full border-b bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="font-bold">ClassTrack</div>
            <div className="text-xs muted">Interview tracker</div>
          </div>
        </div>
        <nav className="mt-7 flex gap-2 overflow-x-auto md:flex-col">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-xl bg-slate-50 p-3 md:block">
          <div className="text-sm font-semibold">Data Analytics</div>
          <div className="mt-1 text-xs muted">Training batch</div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-5 flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-700 md:mt-8"
        >
          <LogOut size={17} /> Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm muted">Training center / {title}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {title === "Dashboard" ? "Dashboard overview" : title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary flex items-center gap-2"
              onClick={refresh}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <div className="hidden rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 sm:block">
              {username}
            </div>
          </div>
        </header>

        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
            <button onClick={clearNotice} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            <button onClick={clearError} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}
