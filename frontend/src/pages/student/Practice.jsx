import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Code2,
  Database,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAvailableSkills,
} from "../../services/skillService";

import {
  getPracticeTopics,
} from "../../services/practiceService";

export default function Practice() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [topics, setTopics] = useState([]);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [selectedTopic, setSelectedTopic] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("EASY");

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [loadingTopics, setLoadingTopics] =
    useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD SKILLS
  // ============================================================

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoadingSkills(true);
        setError("");

        const data =
          await getAvailableSkills();

        setSkills(data || []);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load available skills."
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

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill);
    setSelectedTopic("");
    setTopics([]);
    setError("");

    try {
      setLoadingTopics(true);

      const data =
        await getPracticeTopics(
          skill.id
        );

      setTopics(data || []);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load topics for this skill."
      );
    } finally {
      setLoadingTopics(false);
    }
  };

  // ============================================================
  // START PRACTICE
  // ============================================================

  const startPractice = () => {
    if (!selectedSkill) {
      return;
    }

    navigate("/practice/questions", {
      state: {
        skillId: selectedSkill.id,
        skillName: selectedSkill.name,
        topic: selectedTopic,
        difficulty,
      },
    });
  };

  // ============================================================
  // ICON
  // ============================================================

  const getSkillIcon = (name = "") => {
    const value =
      name.toLowerCase();

    if (
      value.includes("sql") ||
      value.includes("database")
    ) {
      return Database;
    }

    if (
      value.includes("react") ||
      value.includes("javascript") ||
      value.includes("python") ||
      value.includes("java")
    ) {
      return Code2;
    }

    return Layers3;
  };

  // ============================================================
  // RENDER
  // ============================================================

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

            <BookOpen
              size={18}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              Practice Arena
            </span>

          </div>

        </div>

        {/* HERO */}

        <section className="mt-12">

          <div className="flex items-center gap-2">

            <Sparkles
              size={15}
              className="text-[var(--primary)]"
            />

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Learn before you fight
            </p>

          </div>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Practice Your Skills
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Practice as much as you want. Choose a
            skill, focus on a topic, and improve your
            accuracy before entering the battle.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* SKILLS */}

        <section className="mt-10">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                Step 01
              </p>

              <h2 className="mt-1 text-xl font-black">
                Choose a Skill
              </h2>

            </div>

            {selectedSkill && (
              <span className="text-xs font-bold text-[var(--primary)]">
                {selectedSkill.name}
              </span>
            )}

          </div>

          {loadingSkills ? (

            <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              Loading skills...
            </div>

          ) : skills.length === 0 ? (

            <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-8 text-center">

              <Target
                size={28}
                className="mx-auto text-[var(--muted)]"
              />

              <p className="mt-3 text-sm font-bold">
                No skills available
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Ask the admin to add skills and questions.
              </p>

            </div>

          ) : (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {skills.map((skill, index) => {

                const Icon =
                  getSkillIcon(skill.name);

                const isSelected =
                  selectedSkill?.id === skill.id;

                return (
                  <motion.button
                    key={skill.id}
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.04,
                    }}
                    onClick={() =>
                      handleSkillSelect(skill)
                    }
                    className={`group relative overflow-hidden border p-5 text-left transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
                    }`}
                  >

                    <div
                      className={`flex h-11 w-11 items-center justify-center ${
                        isSelected
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-soft)] text-[var(--primary)]"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <h3 className="mt-5 text-sm font-black">
                      {skill.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                      {skill.description ||
                        "Practice questions and improve your skill."}
                    </p>

                    <ChevronRight
                      size={15}
                      className={`absolute right-4 top-5 transition ${
                        isSelected
                          ? "text-[var(--primary)]"
                          : "text-[var(--muted)] group-hover:text-[var(--primary)]"
                      }`}
                    />

                  </motion.button>
                );
              })}

            </div>
          )}

        </section>

        {/* TOPIC */}

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

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                Step 02
              </p>

              <h2 className="mt-1 text-xl font-black">
                Choose a Topic
              </h2>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Focus your practice on a specific area.
              </p>

            </div>

            {loadingTopics ? (

              <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
                Loading topics...
              </div>

            ) : topics.length === 0 ? (

              <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
                No topics found for this skill.
              </div>

            ) : (

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  onClick={() =>
                    setSelectedTopic("")
                  }
                  className={`border px-4 py-3 text-xs font-black transition ${
                    selectedTopic === ""
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  All Topics
                </button>

                {topics.map((topic) => {

                  const topicName =
                    typeof topic === "string"
                      ? topic
                      : topic.topic;

                  return (
                    <button
                      key={topicName}
                      onClick={() =>
                        setSelectedTopic(
                          topicName
                        )
                      }
                      className={`border px-4 py-3 text-xs font-black transition ${
                        selectedTopic === topicName
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {topicName}
                    </button>
                  );
                })}

              </div>
            )}

          </motion.section>

        )}

        {/* DIFFICULTY */}

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
            transition={{
              delay: 0.05,
            }}
            className="mt-12"
          >

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                Step 03
              </p>

              <h2 className="mt-1 text-xl font-black">
                Choose Difficulty
              </h2>

            </div>

            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">

              {[
                {
                  value: "EASY",
                  label: "Easy",
                  description: "Build your fundamentals.",
                },
                {
                  value: "INTERMEDIATE",
                  label: "Intermediate",
                  description: "Challenge your knowledge.",
                },
                {
                  value: "HARD",
                  label: "Hard",
                  description: "Push your limits.",
                },
              ].map((item) => {

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
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span
                        className={`text-xs font-black ${
                          active
                            ? "text-[var(--primary)]"
                            : ""
                        }`}
                      >
                        {item.label}
                      </span>

                      {active && (
                        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                      )}

                    </div>

                    <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">
                      {item.description}
                    </p>

                  </button>
                );
              })}

            </div>

          </motion.section>

        )}

        {/* PRACTICE CTA */}

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
            transition={{
              delay: 0.1,
            }}
            className="mt-12"
          >

            <div className="flex flex-col justify-between gap-5 border border-[var(--border)] bg-[var(--surface)] p-6 sm:flex-row sm:items-center">

              <div>

                <div className="flex items-center gap-2">

                  <BookOpen
                    size={17}
                    className="text-[var(--primary)]"
                  />

                  <span className="text-xs font-black uppercase tracking-wider">
                    Practice Mode
                  </span>

                </div>

                <p className="mt-2 text-sm text-[var(--muted)]">

                  {selectedTopic
                    ? `Practice ${selectedTopic} questions`
                    : `Practice ${selectedSkill.name} questions`}

                  {" "}at{" "}

                  {difficulty.toLowerCase()} difficulty.

                </p>

              </div>

              <button
                onClick={startPractice}
                className="flex items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
              >
                Start Practice
                <ChevronRight size={15} />
              </button>

            </div>

          </motion.section>

        )}

      </main>

    </div>
  );
}