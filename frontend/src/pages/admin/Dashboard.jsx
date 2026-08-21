import { useEffect, useState } from "react";

import {
  Activity,
  BookOpen,
  Brain,
  Target,
  Users,
  Swords,
  Trophy,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getAdminDashboardStats,
} from "../../services/adminDashboardService";


export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, []);


  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAdminDashboardStats();

      setStats(data);

    } catch (err) {

      console.error(
        "Failed to load admin dashboard:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Failed to load dashboard statistics."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[var(--bg)]">

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Loading Dashboard...
          </h1>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse border border-[var(--border)] bg-[var(--surface)]"
              />
            ))}

          </div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-full bg-[var(--bg)]">

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Dashboard
          </h1>

          <div className="mt-8 border border-red-500/30 bg-red-500/10 p-6">

            <p className="text-sm font-bold text-red-400">
              {error}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-4 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white"
            >
              Retry
            </button>

          </div>

        </main>

      </div>
    );
  }


  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Welcome back,{" "}
            {user?.name?.split(" ")[0] || "Admin"}
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage the content and progression system of
            SkillArena.
          </p>

        </div>


        {/* ================================================= */}
        {/* AUTOMATIC BATTLE ENGINE */}
        {/* ================================================= */}

        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <Activity size={21} />
              </div>

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                  Automatic Battle Engine
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Battle generation is automatic
                </h2>

                <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
                  Students choose a skill and difficulty.
                  SkillArena automatically selects randomized
                  questions from the available question bank.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--success)]">

              <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />

              Active

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* MAIN STATISTICS */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Users}
            label="Total Students"
            value={stats?.total_students ?? 0}
          />

          <StatCard
            icon={BookOpen}
            label="Question Bank"
            value={stats?.total_questions ?? 0}
          />

          <StatCard
            icon={Brain}
            label="Skills"
            value={stats?.total_skills ?? 0}
          />

          <StatCard
            icon={Target}
            label="Active Quests"
            value={stats?.active_quests ?? 0}
          />

        </div>


        {/* ================================================= */}
        {/* BATTLE STATISTICS */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Swords}
            label="Battles Generated"
            value={stats?.total_battles ?? 0}
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed Battles"
            value={stats?.completed_battles ?? 0}
          />

          <StatCard
            icon={Trophy}
            label="Average Score"
            value={`${stats?.average_percentage ?? 0}%`}
          />

          <StatCard
            icon={Activity}
            label="Question Accuracy"
            value={`${stats?.accuracy ?? 0}%`}
          />

        </div>


        {/* ================================================= */}
        {/* CONTENT MANAGEMENT + ACCOUNT */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* CONTENT */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-6 xl:col-span-2">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-black">
                  Content Management
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Manage the content that powers the
                  SkillArena engine.
                </p>

              </div>

              <BookOpen
                size={18}
                className="text-[var(--primary)]"
              />

            </div>


            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <QuickAction
                icon={BookOpen}
                title="Question Bank"
                description="Upload and manage questions"
                path="/admin/questions"
              />

              <QuickAction
                icon={Brain}
                title="Skills"
                description="Manage skills and categories"
                path="/admin/skills"
              />

              <QuickAction
                icon={Target}
                title="Quests"
                description="Create rewards and challenges"
                path="/admin/quests"
              />

            </div>

          </div>


          {/* ACCOUNT */}

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

              <InfoRow
                label="Student XP"
                value={
                  stats?.total_student_xp ?? 0
                }
              />

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* SYSTEM STATUS */}
        {/* ================================================= */}

        <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-black">
                Battle System
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Battles are generated automatically from
                the question bank.
              </p>

            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--success)]">

              <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />

              Automatic

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

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


// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon: Icon,
  title,
  description,
  path,
}) {
  return (
    <button
      onClick={() => {
        window.location.href = path;
      }}
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


// ============================================================
// INFO ROW
// ============================================================

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