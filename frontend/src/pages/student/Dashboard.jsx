import {
  Award,
  BookOpen,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <div className="rounded-xl bg-indigo-500/10 p-3">
          <Icon className="h-6 w-6 text-indigo-400" />
        </div>

      </div>

      <p className="mt-5 text-sm text-slate-400">
        {label}
      </p>

      <h3 className="mt-1 text-2xl font-bold text-white">
        {value}
      </h3>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}

    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-xl font-bold">
              SkillArena
            </h1>

            <p className="text-sm text-slate-400">
              Level up your skills.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.name}
              </p>

              <p className="text-xs text-slate-400">
                Level {user?.level}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>

          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        <section className="mb-8">

          <p className="text-sm text-indigo-400">
            Welcome back 👋
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            {user?.name}
          </h2>

          <p className="mt-2 text-slate-400">
            Keep practicing and climb the leaderboard.
          </p>

        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={Zap}
            label="Total XP"
            value={user?.xp ?? 0}
            description="Experience earned"
          />

          <StatCard
            icon={Award}
            label="Current Level"
            value={user?.level ?? 1}
            description="Keep learning to level up"
          />

          <StatCard
            icon={Flame}
            label="Practice Streak"
            value="0 days"
            description="Coming with activity tracking"
          />

          <StatCard
            icon={Trophy}
            label="Leaderboard"
            value="#—"
            description="Complete quizzes to rank"
          />

        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-lg font-semibold">
                  Continue Learning
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Pick a skill and start practicing.
                </p>
              </div>

              <BookOpen className="h-6 w-6 text-indigo-400" />

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              {[
                "JavaScript",
                "Python",
                "React",
                "Database",
              ].map((skill) => (
                <button
                  key={skill}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-left transition hover:border-indigo-500 hover:bg-slate-900"
                >
                  <h4 className="font-semibold">
                    {skill}
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Start practice →
                  </p>
                </button>
              ))}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />

              <h3 className="font-semibold">
                Your Progress
              </h3>
            </div>

            <div className="mt-6">

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Level {user?.level}
                </span>

                <span className="text-slate-400">
                  {user?.xp ?? 0} XP
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(
                      ((user?.xp ?? 0) % 1000) / 10,
                      100
                    )}%`,
                  }}
                />

              </div>

              <p className="mt-3 text-xs text-slate-500">
                Keep completing assessments to unlock higher levels.
              </p>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}