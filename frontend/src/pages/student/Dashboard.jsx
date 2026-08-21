import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  Loader2,
  Swords,
  Target,
  Trophy,
  Zap,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getAvailableSkills,
} from "../../services/skillService";

import {
  generateBattle,
} from "../../services/battleService";


export default function BattleSetup() {

  const navigate = useNavigate();

  const [skills, setSkills] =
    useState([]);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [difficulty, setDifficulty] =
    useState("");

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ============================================================
  // LOAD SKILLS
  // ============================================================

  useEffect(() => {

    const loadSkills = async () => {

      try {

        setLoadingSkills(true);

        const data =
          await getAvailableSkills();

        setSkills(data || []);

      } catch (err) {

        console.error(
          "Failed to load skills:",
          err
        );

        setError(
          "Unable to load skills."
        );

      } finally {

        setLoadingSkills(false);

      }
    };

    loadSkills();

  }, []);


  // ============================================================
  // START BATTLE
  // ============================================================

  const handleStartBattle = async () => {

    if (
      !selectedSkill ||
      !difficulty
    ) {

      setError(
        "Please select a skill and difficulty."
      );

      return;

    }

    try {

      setStarting(true);
      setError("");

      const battle =
        await generateBattle({
          skillId:
            selectedSkill.id,

          difficulty,

          /*
           * IMPORTANT:
           * No topic is sent.
           */

          questionCount: 10,

          durationMinutes: 10,
        });

      navigate(
        `/practice/${battle.assessment_id}`
      );

    } catch (err) {

      console.error(
        "Failed to generate battle:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to generate battle."
      );

    } finally {

      setStarting(false);

    }
  };


  return (

    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <button
          onClick={() =>
            navigate("/practice")
          }
          className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
        >

          <ArrowLeft size={16} />

          Practice Arena

        </button>


        <section className="mt-10">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary)] text-white">

              <Swords size={20} />

            </div>

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                Battle Arena
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Enter the Battle
              </h1>

            </div>

          </div>


          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Choose your skill and difficulty.
            SkillArena will randomly select questions
            from every available topic at that level.
          </p>

        </section>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (

          <div className="mt-7 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>

        )}


        {/* ================================================== */}
        {/* STEP 01 — SKILL */}
        {/* ================================================== */}

        <section className="mt-10">

          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
            Step 01
          </p>

          <h2 className="mt-1 text-xl font-black">
            Choose Your Skill
          </h2>


          {loadingSkills ? (

            <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              Loading skills...
            </div>

          ) : (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {skills.map(
                (skill) => {

                  const active =
                    selectedSkill?.id ===
                    skill.id;

                  return (

                    <button
                      key={skill.id}
                      onClick={() => {

                        setSelectedSkill(
                          skill
                        );

                        setDifficulty(
                          ""
                        );

                        setError("");

                      }}
                      className={`border p-5 text-left transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex h-10 w-10 items-center justify-center bg-[var(--surface-soft)] text-[var(--primary)]">

                          <Swords
                            size={18}
                          />

                        </div>


                        {active && (

                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />

                        )}

                      </div>


                      <h3 className="mt-5 text-sm font-black">
                        {skill.name}
                      </h3>


                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {skill.description ||
                          "Test your knowledge in this skill."}
                      </p>

                    </button>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* STEP 02 — DIFFICULTY */}
        {/* ================================================== */}

        {selectedSkill && (

          <motion.section
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-12"
          >

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
              Step 02
            </p>

            <h2 className="mt-1 text-xl font-black">
              Choose Battle Level
            </h2>


            <p className="mt-2 text-sm text-[var(--muted)]">
              Questions will be randomly selected
              from all topics at this level.
            </p>


            <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">

              {[
                {
                  value: "EASY",
                  label: "Easy",
                  description:
                    "Test your fundamentals.",
                },
                {
                  value: "INTERMEDIATE",
                  label: "Intermediate",
                  description:
                    "Challenge your knowledge.",
                },
                {
                  value: "HARD",
                  label: "Hard",
                  description:
                    "Push your limits.",
                },
              ].map(
                (item) => {

                  const active =
                    difficulty ===
                    item.value;

                  return (

                    <button
                      key={item.value}
                      onClick={() =>
                        setDifficulty(
                          item.value
                        )
                      }
                      className={`border p-6 text-left transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <Zap
                            size={17}
                            className={
                              active
                                ? "text-[var(--primary)]"
                                : "text-[var(--muted)]"
                            }
                          />

                          <span
                            className={`text-sm font-black ${
                              active
                                ? "text-[var(--primary)]"
                                : ""
                            }`}
                          >
                            {item.label}
                          </span>

                        </div>


                        {active && (

                          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />

                        )}

                      </div>


                      <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">
                        {item.description}
                      </p>

                    </button>

                  );

                }
              )}

            </div>

          </motion.section>

        )}


        {/* ================================================== */}
        {/* BATTLE SUMMARY */}
        {/* ================================================== */}

        {selectedSkill &&
          difficulty && (

          <motion.section
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-10"
          >

            <div className="border border-[var(--primary)]/30 bg-[var(--primary-soft)] p-6">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <Swords
                      size={18}
                      className="text-[var(--primary)]"
                    />

                    <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--primary)]">
                      Battle Ready
                    </span>

                  </div>


                  <h2 className="mt-2 text-xl font-black">
                    {selectedSkill.name} •{" "}
                    {difficulty}
                  </h2>


                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    10 random questions will be
                    selected from all available topics
                    for this skill and difficulty.
                  </p>

                </div>


                <button
                  onClick={
                    handleStartBattle
                  }
                  disabled={starting}
                  className="flex shrink-0 items-center justify-center gap-2 bg-[var(--primary)] px-7 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
                >

                  {starting ? (

                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Creating Battle...

                    </>

                  ) : (

                    <>
                      <Swords size={16} />

                      Start Battle

                      <ChevronRight
                        size={16}
                      />

                    </>

                  )}

                </button>

              </div>

            </div>

          </motion.section>

        )}


        {/* ================================================== */}
        {/* INFO */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">

          <div className="bg-[var(--surface)] p-5">

            <Swords
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
              Questions
            </p>

            <p className="mt-1 text-sm font-black">
              10 Random
            </p>

          </div>


          <div className="bg-[var(--surface)] p-5">

            <Target
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
              Time
            </p>

            <p className="mt-1 text-sm font-black">
              10 Minutes
            </p>

          </div>


          <div className="bg-[var(--surface)] p-5">

            <Trophy
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
              Rewards
            </p>

            <p className="mt-1 text-sm font-black">
              XP + Badges
            </p>

          </div>

        </section>

      </main>

    </div>

  );
}