import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { getMySkillProgress } from "../../services/skillService";

export default function SkillTree() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getMySkillProgress();

        setSkills(data);
      } catch (err) {
        console.error(
          "Failed to load skill progress:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load your skill tree."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  const categories = useMemo(() => {
    const grouped = {};

    skills.forEach((skill) => {
      if (!grouped[skill.category_id]) {
        grouped[skill.category_id] = {
          id: skill.category_id,
          name: skill.category_name,
          skills: [],
        };
      }

      grouped[
        skill.category_id
      ].skills.push(skill);
    });

    return Object.values(grouped);
  }, [skills]);

  const getSkillState = (skill) => {
    if (skill.xp >= 300) {
      return {
        label: "Mastered",
        type: "mastered",
      };
    }

    if (skill.xp > 0) {
      return {
        label: "In Progress",
        type: "progress",
      };
    }

    return {
      label: "Locked",
      type: "locked",
    };
  };

  const getProgress = (xp) => {
    const maxXp = 300;

    return Math.min(
      100,
      Math.round((xp / maxXp) * 100)
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
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
            Loading Skill Tree
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
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="flex items-center gap-2">
            <Zap
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
            Your progression
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Skill Tree
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Build your expertise by completing battles,
            answering questions, and mastering individual
            skills.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!error && skills.length === 0 && (
          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <Target
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <h2 className="mt-4 font-black">
              No skills available
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Skills will appear here once they are
              created by the administrator.
            </p>

          </div>
        )}

        {/* CATEGORY TREE */}

        <div className="mt-10 space-y-10">

          {categories.map(
            (category, categoryIndex) => (
              <motion.section
                key={category.id}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    categoryIndex * 0.08,
                }}
              >

                {/* CATEGORY HEADER */}

                <div className="mb-5 flex items-center gap-3">

                  <div className="h-8 w-1 bg-[var(--primary)]" />

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                      Skill Branch
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {category.name}
                    </h2>
                  </div>

                </div>

                {/* SKILLS */}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  {category.skills.map(
                    (skill, skillIndex) => {

                      const state =
                        getSkillState(
                          skill
                        );

                      const progress =
                        getProgress(
                          skill.xp
                        );

                      return (
                        <motion.article
                          key={skill.skill_id}
                          initial={{
                            opacity: 0,
                            scale: 0.97,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          transition={{
                            delay:
                              categoryIndex *
                                0.08 +
                              skillIndex *
                                0.05,
                          }}
                          whileHover={{
                            y:
                              state.type ===
                              "locked"
                                ? 0
                                : -4,
                          }}
                          className={`relative overflow-hidden border bg-[var(--surface)] p-6 ${
                            state.type ===
                            "mastered"
                              ? "border-[var(--success)]/40"
                              : state.type ===
                                "progress"
                              ? "border-[var(--primary)]/40"
                              : "border-[var(--border)]"
                          }`}
                        >

                          {/* TOP */}

                          <div className="flex items-start justify-between">

                            <div
                              className={`flex h-12 w-12 items-center justify-center ${
                                state.type ===
                                "mastered"
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : state.type ===
                                    "progress"
                                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                                  : "bg-[var(--surface-soft)] text-[var(--muted)]"
                              }`}
                            >
                              {state.type ===
                              "mastered" ? (
                                <Trophy
                                  size={20}
                                />
                              ) : state.type ===
                                "progress" ? (
                                <Zap
                                  size={20}
                                />
                              ) : (
                                <Lock
                                  size={19}
                                />
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                state.type ===
                                "mastered"
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : state.type ===
                                    "progress"
                                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                                  : "bg-[var(--surface-soft)] text-[var(--muted)]"
                              }`}
                            >
                              {state.label}
                            </span>

                          </div>

                          {/* NAME */}

                          <h3 className="mt-5 text-lg font-black">
                            {skill.skill_name}
                          </h3>

                          {/* PROGRESS */}

                          <div className="mt-5">

                            <div className="flex items-center justify-between">

                              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                                Skill Progress
                              </span>

                              <span className="text-xs font-black">
                                {progress}%
                              </span>

                            </div>

                            <div className="mt-2 h-2 overflow-hidden bg-[var(--surface-soft)]">

                              <motion.div
                                initial={{
                                  width: 0,
                                }}
                                animate={{
                                  width: `${progress}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                  delay:
                                    categoryIndex *
                                      0.08 +
                                    skillIndex *
                                      0.05,
                                }}
                                className="h-full bg-[var(--primary)]"
                              />

                            </div>

                          </div>

                          {/* STATS */}

                          <div className="mt-5 grid grid-cols-3 gap-2">

                            <div className="bg-[var(--surface-soft)] p-3">

                              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                XP
                              </p>

                              <p className="mt-1 text-sm font-black">
                                {skill.xp}
                              </p>

                            </div>

                            <div className="bg-[var(--surface-soft)] p-3">

                              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                Accuracy
                              </p>

                              <p className="mt-1 text-sm font-black">
                                {skill.accuracy}%
                              </p>

                            </div>

                            <div className="bg-[var(--surface-soft)] p-3">

                              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                Battles
                              </p>

                              <p className="mt-1 text-sm font-black">
                                {
                                  skill.battles_completed
                                }
                              </p>

                            </div>

                          </div>

                          {/* QUESTIONS */}

                          <div className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">

                            <CheckCircle2
                              size={14}
                              className="text-[var(--success)]"
                            />

                            <span>
                              {
                                skill.questions_correct
                              }{" "}
                              /{" "}
                              {
                                skill.questions_answered
                              }{" "}
                              questions correct
                            </span>

                          </div>

                        </motion.article>
                      );
                    }
                  )}

                </div>

              </motion.section>
            )
          )}

        </div>

      </main>
    </div>
  );
}