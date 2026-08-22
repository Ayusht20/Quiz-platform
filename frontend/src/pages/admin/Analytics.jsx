import { useEffect, useState } from "react";

import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Brain,
  Swords,
  Target,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import {
  getAdminAnalytics,
} from "../../services/adminManagementService";


export default function Analytics() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadAnalytics();
  }, []);


  const loadAnalytics = async () => {

    try {

      setLoading(true);
      setError("");

      const result =
        await getAdminAnalytics();

      setData(result);

    } catch (err) {

      console.error(
        "Failed to load analytics:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Failed to load analytics."
      );

    } finally {

      setLoading(false);

    }
  };


  if (loading) {

    return (
      <div className="min-h-full bg-[var(--bg)]">

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Platform Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Analytics
          </h1>

          <div className="mt-8 h-40 animate-pulse border border-[var(--border)] bg-[var(--surface)]" />

        </main>

      </div>
    );
  }


  if (error) {

    return (
      <div className="min-h-full bg-[var(--bg)]">

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <h1 className="text-3xl font-black">
            Analytics
          </h1>

          <div className="mt-8 border border-red-500/30 bg-red-500/10 p-6">

            <p className="text-sm font-bold text-red-400">
              {error}
            </p>

            <button
              onClick={loadAnalytics}
              className="mt-4 bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
            >
              Retry
            </button>

          </div>

        </main>

      </div>
    );
  }


  const difficulty =
    data?.difficulty_distribution || {};


  return (
    <div className="min-h-full bg-[var(--bg)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Platform Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Analytics
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Monitor activity and content performance across
            SkillArena.
          </p>

        </div>


        {/* OVERVIEW */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Metric
            icon={Users}
            label="Students"
            value={data?.students?.total ?? 0}
            extra={`${data?.students?.active ?? 0} active`}
          />

          <Metric
            icon={BookOpen}
            label="Questions"
            value={data?.questions?.total ?? 0}
          />

          <Metric
            icon={Swords}
            label="Battles"
            value={data?.battles?.generated ?? 0}
            extra={`${data?.battles?.completed ?? 0} completed`}
          />

          <Metric
            icon={Trophy}
            label="Total XP"
            value={data?.total_xp ?? 0}
          />

        </div>


        {/* PERFORMANCE */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-black">
                  Answer Performance
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Overall question answering activity.
                </p>

              </div>

              <Activity
                size={18}
                className="text-[var(--primary)]"
              />

            </div>


            <div className="mt-8 grid grid-cols-2 gap-4">

              <Performance
                icon={CheckCircle2}
                label="Correct"
                value={
                  data?.answers?.correct ?? 0
                }
              />

              <Performance
                icon={XCircle}
                label="Incorrect"
                value={
                  data?.answers?.incorrect ?? 0
                }
              />

              <Performance
                icon={BarChart3}
                label="Accuracy"
                value={`${data?.answers?.accuracy ?? 0}%`}
              />

              <Performance
                icon={Trophy}
                label="Average Score"
                value={`${data?.average_score ?? 0}%`}
              />

            </div>

          </section>


          {/* DIFFICULTY */}

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-black">
                  Question Difficulty
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Current question-bank distribution.
                </p>

              </div>

              <Brain
                size={18}
                className="text-[var(--primary)]"
              />

            </div>


            <div className="mt-7 space-y-5">

              <DifficultyBar
                label="Easy"
                value={difficulty.EASY || 0}
                total={data?.questions?.total}
              />

              <DifficultyBar
                label="Medium"
                value={
                  difficulty.MEDIUM ||
                  difficulty.INTERMEDIATE ||
                  0
                }
                total={data?.questions?.total}
              />

              <DifficultyBar
                label="Hard"
                value={
                  difficulty.HARD ||
                  difficulty.EXPERT ||
                  0
                }
                total={data?.questions?.total}
              />

            </div>

          </section>

        </div>


        {/* TOP SKILLS */}

        <section className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-black">
                Question Bank by Skill
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Skills with the largest question banks.
              </p>

            </div>

            <Target
              size={18}
              className="text-[var(--primary)]"
            />

          </div>


          <div className="mt-6 space-y-4">

            {data?.top_skills?.length ? (

              data.top_skills.map((skill) => {

                const max =
                  data.top_skills[0]
                    ?.question_count || 1;

                const percentage =
                  Math.min(
                    100,
                    Math.round(
                      (
                        skill.question_count /
                        max
                      ) * 100
                    )
                  );

                return (
                  <div
                    key={skill.skill_id}
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-black">
                        {skill.skill_name}
                      </span>

                      <span className="text-xs font-bold text-[var(--muted)]">
                        {skill.question_count}
                      </span>

                    </div>

                    <div className="mt-2 h-2 overflow-hidden bg-[var(--surface-soft)]">

                      <div
                        className="h-full bg-[var(--primary)]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })

            ) : (

              <p className="text-sm text-[var(--muted)]">
                No skill data available yet.
              </p>

            )}

          </div>

        </section>


        {/* PLATFORM SUMMARY */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Summary
            icon={Brain}
            label="Skills"
            value={data?.skills?.total ?? 0}
          />

          <Summary
            icon={Target}
            label="Active Quests"
            value={data?.quests?.active ?? 0}
          />

          <Summary
            icon={BookOpen}
            label="Answers"
            value={data?.answers?.total ?? 0}
          />

          <Summary
            icon={BarChart3}
            label="Correct Rate"
            value={`${data?.answers?.accuracy ?? 0}%`}
          />

        </section>

      </main>

    </div>
  );
}


// ============================================================
// METRIC
// ============================================================

function Metric({
  icon: Icon,
  label,
  value,
  extra,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

      {extra && (
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          {extra}
        </p>
      )}

    </div>
  );
}


// ============================================================
// PERFORMANCE
// ============================================================

function Performance({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="bg-[var(--surface-soft)] p-4">

      <Icon
        size={17}
        className="text-[var(--primary)]"
      />

      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// DIFFICULTY BAR
// ============================================================

function DifficultyBar({
  label,
  value,
  total,
}) {

  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div>

      <div className="flex items-center justify-between">

        <span className="text-xs font-black">
          {label}
        </span>

        <span className="text-xs text-[var(--muted)]">
          {value} ({percentage}%)
        </span>

      </div>

      <div className="mt-2 h-2 bg-[var(--surface-soft)]">

        <div
          className="h-full bg-[var(--primary)]"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY
// ============================================================

function Summary({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <Icon
        size={17}
        className="text-[var(--primary)]"
      />

      <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">
        {value}
      </p>

    </div>
  );
}