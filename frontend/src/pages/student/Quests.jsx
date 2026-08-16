import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { getMyQuests } from "../../services/questService";


export default function Quests() {

  const navigate = useNavigate();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadQuests = async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getMyQuests();

        setQuests(data);

      } catch (err) {

        console.error(
          "Failed to load quests:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to load quests."
        );

      } finally {

        setLoading(false);

      }
    };


    loadQuests();

  }, []);


  const groupedQuests = useMemo(() => {

    return {
      DAILY: quests.filter(
        (quest) =>
          quest.quest_type === "DAILY"
      ),

      WEEKLY: quests.filter(
        (quest) =>
          quest.quest_type === "WEEKLY"
      ),

      ACHIEVEMENT: quests.filter(
        (quest) =>
          quest.quest_type ===
          "ACHIEVEMENT"
      ),
    };

  }, [quests]);


  const getProgressPercentage = (
    quest
  ) => {

    if (!quest.target_value) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (quest.progress /
          quest.target_value) *
          100
      )
    );
  };


  const getQuestIcon = (
    quest
  ) => {

    if (quest.completed) {
      return (
        <CheckCircle2 size={20} />
      );
    }

    if (
      quest.target_type ===
      "BATTLES"
    ) {
      return <Trophy size={20} />;
    }

    if (
      quest.target_type ===
      "CORRECT_ANSWERS"
    ) {
      return <Target size={20} />;
    }

    return <Zap size={20} />;
  };


  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">

        <div className="text-center">

          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mx-auto h-10 w-10 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
          />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
            Loading Quests
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

            <Target
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
            Complete challenges
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Quests
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Complete quests to earn bonus XP and
            accelerate your progression.
          </p>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>

        )}


        {/* EMPTY */}

        {!error &&
          quests.length === 0 && (

            <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

              <Target
                size={32}
                className="mx-auto text-[var(--muted)]"
              />

              <h2 className="mt-4 font-black">
                No active quests
              </h2>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Check back later for new challenges.
              </p>

            </div>

          )}


        {/* QUEST GROUPS */}

        <div className="mt-10 space-y-12">

          {[
            {
              key: "DAILY",
              title: "Daily Quests",
              description:
                "Complete these challenges today.",
            },
            {
              key: "WEEKLY",
              title: "Weekly Quests",
              description:
                "Longer challenges with bigger rewards.",
            },
            {
              key: "ACHIEVEMENT",
              title: "Achievements",
              description:
                "Permanent progression challenges.",
            },
          ].map((section) => {

            const sectionQuests =
              groupedQuests[
                section.key
              ];

            if (
              sectionQuests.length === 0
            ) {
              return null;
            }

            return (
              <section
                key={section.key}
              >

                {/* SECTION HEADER */}

                <div className="mb-5">

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                    {section.key}
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {section.title}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {section.description}
                  </p>

                </div>


                {/* QUEST CARDS */}

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {sectionQuests.map(
                    (
                      quest,
                      index
                    ) => {

                      const percentage =
                        getProgressPercentage(
                          quest
                        );

                      return (
                        <motion.article
                          key={quest.id}
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
                              index *
                              0.06,
                          }}
                          className={`relative overflow-hidden border bg-[var(--surface)] p-6 ${
                            quest.completed
                              ? "border-[var(--success)]/40"
                              : "border-[var(--border)]"
                          }`}
                        >

                          {/* TOP ACCENT */}

                          <div
                            className={`absolute left-0 top-0 h-1 w-full ${
                              quest.completed
                                ? "bg-[var(--success)]"
                                : "bg-[var(--primary)]"
                            }`}
                          />


                          {/* TOP ROW */}

                          <div className="flex items-start justify-between">

                            <div
                              className={`flex h-11 w-11 items-center justify-center ${
                                quest.completed
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : "bg-[var(--primary-soft)] text-[var(--primary)]"
                              }`}
                            >
                              {getQuestIcon(
                                quest
                              )}
                            </div>


                            {quest.completed ? (

                              <span className="flex items-center gap-1 bg-[var(--success)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--success)]">
                                <CheckCircle2
                                  size={11}
                                />
                                Completed
                              </span>

                            ) : (

                              <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                                Active
                              </span>

                            )}

                          </div>


                          {/* TITLE */}

                          <h3 className="mt-5 text-lg font-black">
                            {quest.title}
                          </h3>


                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {quest.description ||
                              "Complete this quest to earn XP."}
                          </p>


                          {/* PROGRESS */}

                          <div className="mt-6">

                            <div className="flex items-center justify-between">

                              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                                Progress
                              </span>

                              <span className="text-xs font-black">
                                {
                                  quest.progress
                                }{" "}
                                /{" "}
                                {
                                  quest.target_value
                                }
                              </span>

                            </div>


                            <div className="mt-2 h-2 overflow-hidden bg-[var(--surface-soft)]">

                              <motion.div
                                initial={{
                                  width: 0,
                                }}
                                animate={{
                                  width: `${percentage}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                }}
                                className={`h-full ${
                                  quest.completed
                                    ? "bg-[var(--success)]"
                                    : "bg-[var(--primary)]"
                                }`}
                              />

                            </div>


                            <p className="mt-2 text-right text-[10px] font-bold text-[var(--muted)]">
                              {percentage}%
                            </p>

                          </div>


                          {/* BOTTOM */}

                          <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">

                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">

                              <Zap
                                size={15}
                              />

                              <span>
                                +
                                {
                                  quest.reward_xp
                                }{" "}
                                XP
                              </span>

                            </div>


                            {quest.ends_at && (

                              <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">

                                <Clock3
                                  size={12}
                                />

                                <span>
                                  Limited
                                </span>

                              </div>

                            )}

                          </div>

                        </motion.article>
                      );
                    }
                  )}

                </div>

              </section>
            );
          })}

        </div>

      </main>

    </div>
  );
}