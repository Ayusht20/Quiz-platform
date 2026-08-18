import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  RotateCcw,
  Swords,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getPracticeQuestions,
  checkPracticeAnswer,
} from "../../services/practiceService";

import { getAssessments } from "../../services/assessmentService";
import { getAvailableSkills } from "../../services/skillService";


export default function Practice() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [selectedSkill, setSelectedSkill] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);

  const [error, setError] = useState("");

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const [skillsData, battlesData] =
          await Promise.all([
            getAvailableSkills(),
            getAssessments(),
          ]);

        setSkills(skillsData || []);
        setAssessments(battlesData || []);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load practice data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);


  // ============================================================
  // START PRACTICE
  // ============================================================

  const startPractice = async () => {
    try {
      setStarting(true);
      setError("");

      const data =
        await getPracticeQuestions({
          skillId: selectedSkill
            ? Number(selectedSkill)
            : undefined,
          difficulty:
            difficulty || undefined,
          limit: 10,
        });

      if (!data || data.length === 0) {
        setError(
          "No questions are available for this selection."
        );
        return;
      }

      setQuestions(data);
      setCurrentIndex(0);
      setSelectedOption(null);
      setResult(null);
      setCorrectCount(0);
      setFinished(false);
      setStarted(true);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to start practice."
      );
    } finally {
      setStarting(false);
    }
  };


  // ============================================================
  // CHECK ANSWER
  // ============================================================

  const handleCheckAnswer = async () => {
    if (
      !selectedOption ||
      !questions[currentIndex] ||
      checking ||
      result
    ) {
      return;
    }

    try {
      setChecking(true);

      const data =
        await checkPracticeAnswer(
          questions[currentIndex].id,
          selectedOption
        );

      setResult(data);

      if (data.correct) {
        setCorrectCount(
          (previous) => previous + 1
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to check this answer."
      );
    } finally {
      setChecking(false);
    }
  };


  // ============================================================
  // NEXT
  // ============================================================

  const handleNext = () => {
    if (
      currentIndex >=
      questions.length - 1
    ) {
      setFinished(true);
      return;
    }

    setCurrentIndex(
      (previous) => previous + 1
    );

    setSelectedOption(null);
    setResult(null);
  };


  // ============================================================
  // RESET
  // ============================================================

  const resetPractice = () => {
    setStarted(false);
    setFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setResult(null);
    setCorrectCount(0);
    setError("");
  };


  // ============================================================
  // LOADING
  // ============================================================

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
            Loading Practice
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // PRACTICE SETUP
  // ============================================================

  if (!started) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>


          <section className="mt-12">

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Prepare Yourself
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Practice
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Practice questions before entering an
              official SkillArena battle.
            </p>

          </section>


          {error && (
            <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}


          <section className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">

            <div className="grid gap-8 md:grid-cols-2">

              {/* SKILL */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Choose Skill
                </label>

                <select
                  value={selectedSkill}
                  onChange={(event) =>
                    setSelectedSkill(
                      event.target.value
                    )
                  }
                  className="mt-3 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                >

                  <option value="">
                    All Skills
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


              {/* DIFFICULTY */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value
                    )
                  }
                  className="mt-3 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                >

                  <option value="">
                    All Difficulties
                  </option>

                  <option value="EASY">
                    Easy
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HARD">
                    Hard
                  </option>

                </select>

              </div>

            </div>


            {/* START */}

            <button
              onClick={startPractice}
              disabled={starting}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >

              {starting
                ? "Preparing..."
                : "Start Practice"}

              <ArrowRight size={16} />

            </button>

          </section>


          {/* BATTLE */}

          <section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">

            <div className="flex items-center gap-3">

              <Swords
                size={20}
                className="text-[var(--primary)]"
              />

              <div>

                <h2 className="font-black">
                  Ready for an official Battle?
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Practice first, then test yourself
                  officially.
                </p>

              </div>

            </div>

            {assessments.length > 0 && (
              <button
                onClick={() =>
                  navigate(
                    `/practice/${assessments[0].id}`
                  )
                }
                className="mt-5 flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Enter Battle
                <Swords size={14} />
              </button>
            )}

          </section>

        </main>

      </div>
    );
  }


  // ============================================================
  // FINISHED
  // ============================================================

  if (finished) {
    const accuracy =
      Math.round(
        (correctCount /
          questions.length) *
          100
      );

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto max-w-4xl px-5 py-10 lg:py-16">

          <div className="border border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12">

            <Trophy
              size={42}
              className="mx-auto text-[var(--primary)]"
            />

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Practice Complete
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {correctCount}/{questions.length}
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Accuracy: {accuracy}%
            </p>


            <div className="mt-8 h-2 bg-[var(--surface-soft)]">

              <div
                className="h-full bg-[var(--primary)]"
                style={{
                  width: `${accuracy}%`,
                }}
              />

            </div>


            <div className="mt-10 border border-[var(--primary)]/20 bg-[var(--primary-soft)] p-6">

              <Swords
                size={20}
                className="mx-auto text-[var(--primary)]"
              />

              <h2 className="mt-3 font-black">
                Ready for Battle?
              </h2>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Put your preparation to the test.
              </p>

              {assessments.length > 0 && (
                <button
                  onClick={() =>
                    navigate(
                      `/practice/${assessments[0].id}`
                    )
                  }
                  className="mt-5 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white"
                >
                  Enter Battle
                </button>
              )}

            </div>


            <button
              onClick={resetPractice}
              className="mt-6 inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider text-[var(--muted)]"
            >
              <RotateCcw size={14} />
              Practice Again
            </button>

          </div>

        </main>

      </div>
    );
  }


  // ============================================================
  // QUESTION
  // ============================================================

  const question =
    questions[currentIndex];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-4xl px-5 py-8 lg:py-12">

        <div className="flex items-center justify-between">

          <button
            onClick={resetPractice}
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"
          >
            <ArrowLeft size={16} />
            Practice Setup
          </button>

          <div className="flex items-center gap-2">

            <Zap
              size={17}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              Practice
            </span>

          </div>

        </div>


        {/* PROGRESS */}

        <div className="mt-10">

          <div className="flex justify-between text-xs font-black">

            <span>
              Question {currentIndex + 1}
            </span>

            <span className="text-[var(--muted)]">
              {questions.length}
            </span>

          </div>

          <div className="mt-3 h-1.5 bg-[var(--surface-soft)]">

            <div
              className="h-full bg-[var(--primary)]"
              style={{
                width: `${
                  ((currentIndex + 1) /
                    questions.length) *
                  100
                }%`,
              }}
            />

          </div>

        </div>


        {/* QUESTION */}

        <motion.section
          key={question.id}
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

          <div className="flex justify-between">

            <span className="bg-[var(--primary-soft)] px-3 py-1 text-[9px] font-black uppercase text-[var(--primary)]">
              {question.difficulty}
            </span>

            {question.topic && (
              <span className="text-[10px] text-[var(--muted)]">
                {question.topic}
              </span>
            )}

          </div>


          <h1 className="mt-7 text-xl font-black leading-relaxed sm:text-2xl">
            {question.question_text}
          </h1>


          <div className="mt-8 space-y-3">

            {question.options.map(
              (option, index) => {

                const selected =
                  selectedOption === option.id;

                const correct =
                  result &&
                  result.correct_option_id ===
                    option.id;

                const wrong =
                  result &&
                  selected &&
                  !result.correct;

                return (
                  <button
                    key={option.id}
                    disabled={!!result || checking}
                    onClick={() =>
                      setSelectedOption(
                        option.id
                      )
                    }
                    className={`flex w-full items-center gap-4 border p-4 text-left transition ${
                      correct
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : wrong
                        ? "border-[var(--danger)] bg-[var(--danger)]/10"
                        : selected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--border)] text-xs font-black">
                      {String.fromCharCode(
                        65 + index
                      )}
                    </span>

                    <span className="text-sm font-semibold">
                      {option.option_text}
                    </span>

                    {correct && (
                      <CheckCircle2
                        size={18}
                        className="ml-auto text-[var(--success)]"
                      />
                    )}

                    {wrong && (
                      <XCircle
                        size={18}
                        className="ml-auto text-[var(--danger)]"
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>


          {/* RESULT */}

          {result && (
            <div
              className={`mt-6 border p-5 ${
                result.correct
                  ? "border-[var(--success)]/20 bg-[var(--success)]/10"
                  : "border-[var(--danger)]/20 bg-[var(--danger)]/10"
              }`}
            >

              <div className="flex items-center gap-2">

                {result.correct ? (
                  <CheckCircle2
                    size={18}
                    className="text-[var(--success)]"
                  />
                ) : (
                  <XCircle
                    size={18}
                    className="text-[var(--danger)]"
                  />
                )}

                <span className="font-black">
                  {result.correct
                    ? "Correct!"
                    : "Incorrect"}
                </span>

              </div>

              {result.explanation && (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {result.explanation}
                </p>
              )}

            </div>
          )}


          <div className="mt-7 flex justify-end">

            {!result ? (
              <button
                disabled={
                  !selectedOption ||
                  checking
                }
                onClick={handleCheckAnswer}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase text-white disabled:opacity-40"
              >
                {checking
                  ? "Checking..."
                  : "Check Answer"}

                <CheckCircle2 size={15} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase text-white"
              >
                {currentIndex ===
                questions.length - 1
                  ? "Finish"
                  : "Next"}

                <ArrowRight size={15} />
              </button>
            )}

          </div>

        </motion.section>

      </main>

    </div>
  );
}