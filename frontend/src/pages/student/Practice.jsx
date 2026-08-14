import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAssessments } from "../../services/assessmentService";

export default function Practice() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);

        const data = await getAssessments();

        setAssessments(data);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load available battles."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mx-auto h-10 w-10 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
          />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
            Loading Arena
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="flex items-center gap-2">
            <Swords
              size={18}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              SkillArena
            </span>
          </div>

        </div>

        {/* TITLE */}

        <section className="mt-12">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Choose your challenge
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Enter the Arena
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Pick a skill and prove what you know. Every
            battle earns XP and moves you closer to the
            next level.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!error && assessments.length === 0 && (
          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <Trophy
              size={30}
              className="mx-auto text-[var(--muted)]"
            />

            <h2 className="mt-4 font-black">
              No battles available yet
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Published assessments will appear here.
            </p>
          </div>
        )}

        {/* ASSESSMENTS */}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {assessments.map((assessment, index) => (
            <motion.article
              key={assessment.id}
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.06,
              }}
              whileHover={{
                y: -5,
              }}
              className="group relative overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--primary)]/50"
            >

              {/* TOP ACCENT */}

              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[var(--primary)] to-[var(--violet)] opacity-70" />

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Swords size={19} />
                </div>

                <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                  {assessment.difficulty}
                </span>

              </div>

              <h2 className="mt-6 text-lg font-black">
                {assessment.title}
              </h2>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                {assessment.description ||
                  "Test your knowledge and earn XP."}
              </p>

              {/* STATS */}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="bg-[var(--surface-soft)] p-3">

                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <Clock3 size={13} />

                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Duration
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-black">
                    {assessment.duration_minutes} min
                  </p>

                </div>

                <div className="bg-[var(--surface-soft)] p-3">

                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <Trophy size={13} />

                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Passing
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-black">
                    {assessment.passing_percentage}%
                  </p>

                </div>

              </div>

              {/* XP */}

              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                <Zap size={14} />
                Earn XP by completing this battle
              </div>

              {/* BUTTON */}

              <button
                onClick={() =>
                  navigate(
                    `/practice/${assessment.id}`
                  )
                }
                className="mt-6 flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
              >
                Enter Battle
                <ArrowRight size={15} />
              </button>

            </motion.article>
          ))}

        </div>

      </main>
    </div>
  );
}