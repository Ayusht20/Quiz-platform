import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAvailableSkills,
} from "../../services/skillService";

import {
  getPracticeTopics,
} from "../../services/practiceService";

import {
  generateBattle,
} from "../../services/battleService";


export default function BattleSetup() {

  const navigate = useNavigate();

  const [skills, setSkills] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [skillId, setSkillId] =
    useState("");

  const [topic, setTopic] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("BEGINNER");

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [loadingTopics, setLoadingTopics] =
    useState(false);

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
  // LOAD TOPICS
  // ============================================================

  useEffect(() => {

    if (!skillId) {

      setTopics([]);

      setTopic("");

      return;

    }

    const loadTopics = async () => {

      try {

        setLoadingTopics(true);

        setTopic("");

        const data =
          await getPracticeTopics(
            skillId
          );

        setTopics(data || []);

      } catch (err) {

        console.error(
          "Failed to load topics:",
          err
        );

        setError(
          "Unable to load topics."
        );

      } finally {

        setLoadingTopics(false);

      }
    };

    loadTopics();

  }, [skillId]);


  // ============================================================
  // START BATTLE
  // ============================================================

  const handleStartBattle = async () => {

    if (!skillId) {

      setError(
        "Please select a skill."
      );

      return;

    }

    try {

      setStarting(true);

      setError("");

      const battle =
        await generateBattle({
          skillId: Number(skillId),
          topic: topic || null,
          difficulty,
          questionCount: 10,
          durationMinutes: 10,
        });

      /*
       * Send the student directly
       * to the existing Battle page.
       */

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


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">

        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <button
          onClick={() =>
            navigate("/practice")
          }
          className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
        >
          <ArrowLeft size={16} />
          Practice Arena
        </button>


        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <section className="mt-10">

          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

              <Swords size={20} />

            </div>

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                Arena
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Choose Your Battle
              </h1>

            </div>

          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Choose what you want to fight.
            SkillArena will automatically select
            questions from the question bank.
          </p>

        </section>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (

          <div className="mt-6 border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>

        )}


        {/* ================================================== */}
        {/* SETUP CARD */}
        {/* ================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
        >

          {/* SKILL */}

          <div>

            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Skill
            </label>

            <div className="relative mt-3">

              <select
                value={skillId}
                onChange={(event) =>
                  setSkillId(
                    event.target.value
                  )
                }
                disabled={loadingSkills}
                className="w-full appearance-none border border-[var(--border)] bg-[var(--surface)] px-4 py-4 pr-12 text-sm font-semibold outline-none transition focus:border-[var(--primary)]"
              >

                <option value="">
                  {loadingSkills
                    ? "Loading skills..."
                    : "Select a skill"}
                </option>

                {skills.map((skill) => (

                  <option
                    key={skill.id}
                    value={skill.id}
                  >
                    {skill.name}
                  </option>

                ))}

              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

            </div>

          </div>


          {/* TOPIC */}

          <div className="mt-7">

            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Topic
            </label>

            <div className="relative mt-3">

              <select
                value={topic}
                onChange={(event) =>
                  setTopic(
                    event.target.value
                  )
                }
                disabled={
                  !skillId ||
                  loadingTopics
                }
                className="w-full appearance-none border border-[var(--border)] bg-[var(--surface)] px-4 py-4 pr-12 text-sm font-semibold outline-none transition focus:border-[var(--primary)] disabled:opacity-50"
              >

                <option value="">
                  {loadingTopics
                    ? "Loading topics..."
                    : !skillId
                    ? "Select a skill first"
                    : topics.length
                    ? "All topics"
                    : "No topics available"}
                </option>

                {topics.map(
                  (item, index) => {

                    const topicName =
                      typeof item ===
                      "string"
                        ? item
                        : item.topic ||
                          item.name;

                    return (
                      <option
                        key={
                          topicName ||
                          index
                        }
                        value={topicName}
                      >
                        {topicName}
                      </option>
                    );
                  }
                )}

              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

            </div>

            <p className="mt-2 text-[10px] text-[var(--muted)]">
              Leave this as "All topics" for
              a mixed battle.
            </p>

          </div>


          {/* DIFFICULTY */}

          <div className="mt-7">

            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Battle Level
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {[
                {
                  value: "BEGINNER",
                  label: "Beginner",
                  description: "Warm up",
                },
                {
                  value: "INTERMEDIATE",
                  label: "Intermediate",
                  description: "Level up",
                },
                {
                  value: "HARD",
                  label: "Hard",
                  description: "Challenge",
                },
                {
                  value: "EXPERT",
                  label: "Expert",
                  description: "Elite",
                },
              ].map((level) => {

                const active =
                  difficulty ===
                  level.value;

                return (

                  <button
                    key={level.value}
                    onClick={() =>
                      setDifficulty(
                        level.value
                      )
                    }
                    className={`border p-4 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <Zap
                        size={16}
                        className={
                          active
                            ? "text-[var(--primary)]"
                            : "text-[var(--muted)]"
                        }
                      />

                      {active && (
                        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                      )}

                    </div>

                    <p className="mt-4 text-sm font-black">
                      {level.label}
                    </p>

                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      {level.description}
                    </p>

                  </button>

                );

              })}

            </div>

          </div>


          {/* BATTLE INFO */}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">

            <div className="bg-[var(--surface-soft)] p-4">

              <Swords
                size={17}
                className="text-[var(--primary)]"
              />

              <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Questions
              </p>

              <p className="mt-1 text-sm font-black">
                10 Questions
              </p>

            </div>

            <div className="bg-[var(--surface-soft)] p-4">

              <Target
                size={17}
                className="text-[var(--primary)]"
              />

              <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Time
              </p>

              <p className="mt-1 text-sm font-black">
                10 Minutes
              </p>

            </div>

            <div className="bg-[var(--surface-soft)] p-4">

              <Trophy
                size={17}
                className="text-[var(--primary)]"
              />

              <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Reward
              </p>

              <p className="mt-1 text-sm font-black">
                XP + Badges
              </p>

            </div>

          </div>


          {/* START */}

          <button
            onClick={
              handleStartBattle
            }
            disabled={
              !skillId ||
              starting
            }
            className="mt-8 flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-6 py-4 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {starting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Generating Battle...
              </>
            ) : (
              <>
                <Swords size={17} />

                Generate My Battle
              </>
            )}

          </button>

          <p className="mt-3 text-center text-[9px] text-[var(--muted)]">
            Questions are selected automatically
            from the SkillArena question bank.
          </p>

        </motion.section>

      </main>

    </div>
  );
}