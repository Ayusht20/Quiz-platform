import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Swords,
  Zap,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getPracticeTopics,
} from "../../services/practiceService";

import {
  getAvailableSkills,
} from "../../services/skillService";

import {
  generateBattle,
} from "../../services/battleService";


const difficulties = [
  {
    value: "EASY",
    label: "Easy",
    description: "Warm up and build confidence.",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediate",
    description: "Put your knowledge to the test.",
  },
  {
    value: "HARD",
    label: "Hard",
    description: "For serious SkillArena fighters.",
  },
];


const battleSizes = [
  5,
  10,
  15,
  20,
];


export default function Practice() {

  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [topics, setTopics] = useState([]);

  const [skillId, setSkillId] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] =
    useState("EASY");

  const [questionCount, setQuestionCount] =
    useState(10);

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [loadingTopics, setLoadingTopics] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD SKILLS
  // ==========================================================

  useEffect(() => {

    const loadSkills = async () => {

      try {

        setLoadingSkills(true);
        setError("");

        const data =
          await getAvailableSkills();

        setSkills(data);

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load skills."
        );

      } finally {

        setLoadingSkills(false);

      }
    };

    loadSkills();

  }, []);


  // ==========================================================
  // LOAD TOPICS
  // ==========================================================

  useEffect(() => {

    if (!skillId) {

      setTopics([]);
      setTopic("");

      return;
    }

    const loadTopics = async () => {

      try {

        setLoadingTopics(true);
        setError("");

        const data =
          await getPracticeTopics(
            skillId
          );

        setTopics(data);

        setTopic("");

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load topics."
        );

      } finally {

        setLoadingTopics(false);

      }
    };

    loadTopics();

  }, [skillId]);


  // ==========================================================
  // GENERATE BATTLE
  // ==========================================================

  const handleGenerateBattle = async () => {

    if (!skillId) {

      setError(
        "Please select a skill."
      );

      return;
    }

    if (!topic) {

      setError(
        "Please select a topic."
      );

      return;
    }

    try {

      setGenerating(true);
      setError("");

      const battle =
        await generateBattle({
          skillId: Number(skillId),
          topic,
          difficulty,
          questionCount,
        });

      navigate(
        `/practice/${battle.assessment_id}`
      );

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to generate battle."
      );

    } finally {

      setGenerating(false);

    }
  };


  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">

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

            <Swords
              size={18}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              SkillArena
            </span>

          </div>

        </div>


        {/* HERO */}

        <section className="mt-12">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Automatic Battle System
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Choose Your Battle
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Practice as much as you want.
            When you're ready, choose your
            challenge and SkillArena will
            automatically build a battle from
            the question bank.
          </p>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>

        )}


        {/* BATTLE BUILDER */}

        <div className="mt-10 space-y-6">


          {/* SKILL */}

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

                <Target size={18} />

              </div>

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Step 01
                </p>

                <h2 className="font-black">
                  Choose Skill
                </h2>

              </div>

            </div>


            <div className="mt-5">

              <select
                value={skillId}
                onChange={(event) =>
                  setSkillId(
                    event.target.value
                  )
                }
                disabled={loadingSkills}
                className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
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

            </div>

          </section>


          {/* TOPIC */}

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center bg-[var(--violet)]/10 text-[var(--violet)]">

                <Target size={18} />

              </div>

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Step 02
                </p>

                <h2 className="font-black">
                  Choose Topic
                </h2>

              </div>

            </div>


            <div className="mt-5">

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
                className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
              >

                <option value="">
                  {!skillId
                    ? "Select a skill first"
                    : loadingTopics
                    ? "Loading topics..."
                    : topics.length === 0
                    ? "No topics available"
                    : "Select a topic"}
                </option>

                {topics.map((item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                ))}

              </select>

            </div>

          </section>


          {/* DIFFICULTY */}

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                Step 03
              </p>

              <h2 className="mt-1 font-black">
                Choose Difficulty
              </h2>

            </div>


            <div className="mt-5 grid gap-3 md:grid-cols-3">

              {difficulties.map((item) => {

                const active =
                  difficulty === item.value;

                return (

                  <button
                    key={item.value}
                    onClick={() =>
                      setDifficulty(
                        item.value
                      )
                    }
                    className={`border p-4 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary)]/50"
                    }`}
                  >

                    <p className="text-sm font-black">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {item.description}
                    </p>

                  </button>

                );

              })}

            </div>

          </section>


          {/* QUESTION COUNT */}

          <section className="border border-[var(--border)] bg-[var(--surface)] p-6">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                Step 04
              </p>

              <h2 className="mt-1 font-black">
                Battle Size
              </h2>

            </div>


            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              {battleSizes.map((count) => {

                const active =
                  questionCount === count;

                return (

                  <button
                    key={count}
                    onClick={() =>
                      setQuestionCount(
                        count
                      )
                    }
                    className={`border py-4 text-center transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)]"
                    }`}
                  >

                    <span className="text-lg font-black">
                      {count}
                    </span>

                    <span className="ml-1 text-[9px] font-bold uppercase text-[var(--muted)]">
                      questions
                    </span>

                  </button>

                );

              })}

            </div>

          </section>


          {/* FIGHT */}

          <motion.button
            whileTap={{
              scale: 0.98,
            }}
            onClick={
              handleGenerateBattle
            }
            disabled={generating}
            className="flex w-full items-center justify-center gap-3 bg-[var(--primary)] px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <Swords size={19} />

            {generating
              ? "Building Battle..."
              : "Fight Battle"}

            {!generating && (
              <ArrowRight size={18} />
            )}

          </motion.button>


          {/* XP INFO */}

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--cyan)]">

            <Zap size={14} />

            Complete battles to earn XP,
            level up and unlock achievements.

          </div>

        </div>

      </main>

    </div>
  );
}