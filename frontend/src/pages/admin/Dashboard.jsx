import {
  Activity,
  BookOpen,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-full bg-[var(--bg)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"}
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage SkillArena from one place.
          </p>

        </div>


        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Users}
            label="Total Students"
            value="—"
          />

          <StatCard
            icon={Swords}
            label="Total Battles"
            value="—"
          />

          <StatCard
            icon={BookOpen}
            label="Question Bank"
            value="—"
          />

          <StatCard
            icon={Trophy}
            label="XP Earned"
            value="—"
          />

        </div>


        {/* MAIN GRID */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* QUICK ACTIONS */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-6 xl:col-span-2">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-black">
                  Quick Actions
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Manage the core SkillArena content.
                </p>

              </div>

              <Activity
                size={18}
                className="text-[var(--primary)]"
              />

            </div>


            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <QuickAction
                icon={BookOpen}
                title="Questions"
                description="Manage question bank"
                onClick={() =>
                  window.location.href =
                    "/admin/questions"
                }
              />

              <QuickAction
                icon={Swords}
                title="Battles"
                description="Create and publish"
                onClick={() =>
                  window.location.href =
                    "/admin/assessments"
                }
              />

              <QuickAction
                icon={Users}
                title="Students"
                description="Manage users"
                onClick={() =>
                  window.location.href =
                    "/admin/users"
                }
              />

            </div>

          </div>


          {/* ADMIN INFO */}

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


function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon size={17} />
        </div>

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