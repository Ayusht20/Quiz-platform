import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Brain,
  BarChart3,
  LogOut,
  Shield,
  Target,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Question Bank",
    path: "/admin/questions",
    icon: BookOpen,
  },
  {
    label: "Quests",
    path: "/admin/quests",
    icon: Target,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Skills",
    path: "/admin/skills",
    icon: Brain,
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ====================================================== */}
      {/* SIDEBAR */}
      {/* ====================================================== */}

      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col">

        {/* BRAND */}

        <div className="flex h-20 items-center gap-3 border-b border-[var(--border)] px-6">

          <div className="flex h-10 w-10 items-center justify-center bg-[var(--primary)] text-white">
            <Shield size={19} />
          </div>

          <div>
            <p className="text-sm font-black tracking-tight">
              SkillArena
            </p>

            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Admin Control
            </p>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 px-3 py-6">

          <p className="mb-3 px-4 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
            Management
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                  }`
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}

        </nav>

        {/* INFORMATION */}

        <div className="border-t border-[var(--border)] p-4">

          <div className="mb-4 border border-[var(--border)] bg-[var(--surface-soft)] p-3">

            <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
              Battle System
            </p>

            <p className="mt-2 text-xs font-bold leading-5">
              Battles are generated automatically for students.
            </p>

          </div>

          {/* USER */}

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0">

              <p className="truncate text-xs font-black">
                {user?.name || "Admin"}
              </p>

              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)]">
                Administrator
              </p>

            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={15} />
            Logout
          </button>

        </div>

      </aside>

      {/* ====================================================== */}
      {/* MOBILE TOP BAR */}
      {/* ====================================================== */}

      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:hidden">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center bg-[var(--primary)] text-white">
            <Shield size={15} />
          </div>

          <span className="text-sm font-black">
            SkillArena
          </span>

        </div>

        <button
          onClick={handleLogout}
          className="text-[var(--muted)]"
        >
          <LogOut size={18} />
        </button>

      </div>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <main className="min-w-0 flex-1 pt-16 lg:pt-0">
        <Outlet />
      </main>

    </div>
  );
}