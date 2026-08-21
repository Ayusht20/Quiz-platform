import {
  Activity,
  BookOpen,
  Brain,
  Target,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[var(--bg)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Welcome back,{" "}
            {user?.name?.split(" ")[0] || "Admin"}
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage the content and progression system of SkillArena.
          </p>

        </div>

        {/* ================================================== */}
        {/* SYSTEM STATUS */}
        {/* ================================================== */}

        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <Activity size={19} />
              </div>

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                  Automatic Battle Engine
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Battle generation is automatic
                </h2>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">
                  Students choose a skill and difficulty.
                  SkillArena automatically selects randomized
                  questions from the available question bank.
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />

              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--success)]">
                Active
              </span>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Users}
            label="Total Students"
            value="—"
          />

          <StatCard
            icon={BookOpen}
            label="Question Bank"
            value="—"
          />

          <StatCard
            icon={Brain}
            label="Skills"
            value="—"
          />

          <StatCard
            icon={Target}
            label="Active Quests"
            value="—"
          />

        </div>

        {/* ================================================== */}
        {/* MAIN GRID */}
        {/* ================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* ================================================= */}
          {/* QUICK ACTIONS */}
          {/* ================================================= */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-6 xl:col-span-2">

            <div>

              <h2 className="font-black">
                Content Management
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Manage the content that powers the SkillArena engine.
              </p>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <QuickAction
                icon={BookOpen}
                title="Question Bank"
                description="Upload and manage questions"
                onClick={() =>
                  navigate("/admin/questions")
                }
              />

              <QuickAction
                icon={Brain}
                title="Skills"
                description="Manage skills and categories"
                onClick={() =>
                  navigate("/admin/skills")
                }
              />

              <QuickAction
                icon={Target}
                title="Quests"
                description="Create exciting challenges"
                onClick={() =>
                  navigate("/admin/quests")
                }
              />

            </div>

          </div>

          {/* ================================================= */}
          {/* ADMIN INFO */}
          {/* ================================================= */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <h2 className="font-black">
              Admin Account
            </h2>

            <div className="mt-6 space-y-4">

              <InfoRow
                label="Name"
                value={user?.name || "—"}
              />

              <InfoRow
                label="Email"
                value={user?.email || "—"}
              />

              <InfoRow
                label="Role"
                value={user?.role || "—"}
              />

              <InfoRow
                label="Status"
                value={user?.status || "—"}
              />

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}


/* ============================================================ */
/* STAT CARD */
/* ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={17} />
      </div>

      <p className="mt-5 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

    </div>
  );
}


/* ============================================================ */
/* QUICK ACTION */
/* ============================================================ */

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-left transition hover:border-[var(--primary)]"
    >

      <Icon
        size={17}
        className="text-[var(--primary)]"
      />

      <p className="mt-4 text-sm font-black">
        {title}
      </p>

      <p className="mt-1 text-xs text-[var(--muted)]">
        {description}
      </p>

    </button>
  );
}


/* ============================================================ */
/* INFO ROW */
/* ============================================================ */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">

      <span className="text-xs font-bold text-[var(--muted)]">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-xs font-black">
        {value}
      </span>

    </div>
  );
}