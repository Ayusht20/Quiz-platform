import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RotateCcw,
  Swords,
  Target,
  XCircle,
  Zap,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getPracticeQuestions,
  checkPracticeAnswer,
} from "../../services/practiceService";

export default function PracticeQuestions() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    skillId,
    skillName,
    topic,
    difficulty,
  } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedOption, setSelectedOption] =
    useState(null);

  const [result, setResult] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD QUESTIONS
  // ============================================================

  const loadQuestions = async () => {
    if (!skillId) {
      setError(
        "Practice session information is missing."
      );

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getPracticeQuestions({
          skillId,
          topic,
          difficulty,
          limit: 10,
        });

      setQuestions(data || []);

      setCurrentIndex(0);
      setSelectedOption(null);
      setResult(null);

    } catch (err) {
      console.error(
        "Failed to load practice questions:",
        err
      );

      setError(
        "Unable to load practice questions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [
    skillId,
    topic,
    difficulty,
  ]);

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const currentQuestion =
    questions[currentIndex];

  // ============================================================
  // PROGRESS
  // ============================================================

  const progress = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    return Math.round(
      ((currentIndex + 1) /
        questions.length) *
        100
    );
  }, [
    currentIndex,
    questions.length,
  ]);

  // ============================================================
  // CHECK ANSWER
  // ============================================================

  const handleCheckAnswer = async () => {
    if (
      !currentQuestion ||
      !selectedOption ||
      checking ||
      result
    ) {
      return;
    }

    try {
      setChecking(true);

      const response =
        await checkPracticeAnswer(
          currentQuestion.id,
          selectedOption
        );

      setResult(response);

    } catch (err) {
      console.error(
        "Failed to check answer:",
        err
      );

      setError(
        "Unable to check your answer. Please try again."
      );
    } finally {
      setChecking(false);
    }
  };

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  const handleNext = () => {
    if (
      currentIndex >=
      questions.length - 1
    ) {
      return;
    }

    setCurrentIndex(
      currentIndex + 1
    );

    setSelectedOption(null);
    setResult(null);
    setError("");
  };

  // ============================================================
  // RESTART
  // ============================================================

  const handleRestart = () => {
    loadQuestions();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <div className="flex min-h-screen items-center justify-center">

          <div className="text-center">

            <Loader2
              size={34}
              className="mx-auto animate-spin text-[var(--primary)]"
            />

            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Preparing Practice
            </p>

            <p className="mt-2 text-xs text-[var(--muted)]">
              Finding questions for you...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (
    error &&
    !currentQuestion
  ) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-5">

          <div className="w-full border border-[var(--border)] bg-[var(--surface)] p-8 text-center">

            <CircleAlert
              size={32}
              className="mx-auto text-[var(--danger)]"
            />

            <h1 className="mt-4 text-xl font-black">
              Practice unavailable
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              {error}
            </p>

            <div className="mt-6 flex justify-center gap-3">

              <button
                onClick={() =>
                  navigate("/practice")
                }
                className="flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase"
              >
                <ArrowLeft size={15} />
                Back
              </button>

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase text-white"
              >
                <RotateCcw size={15} />
                Try Again
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // NO QUESTIONS
  // ============================================================

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-5">

          <div className="w-full border border-[var(--border)] bg-[var(--surface)] p-8 text-center">

            <BookOpen
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <h1 className="mt-4 text-xl font-black">
              No questions found
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              There are no questions available for
              this skill, topic and difficulty yet.
            </p>

            <button
              onClick={() =>
                navigate("/practice")
              }
              className="mt-6 flex mx-auto items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase text-white"
            >
              <ArrowLeft size={15} />
              Choose Another Topic
            </button>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate("/practice")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Practice Arena
          </button>

          <div className="flex items-center gap-2">

            <BookOpen
              size={17}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              Practice Mode
            </span>

          </div>

        </div>

        {/* ================================================== */}
        {/* SESSION INFO */}
        {/* ================================================== */}

        <section className="mt-10">

          <div className="flex flex-wrap items-center gap-2">

            <span className="bg-[var(--primary-soft)] px-2.5 py-1 text-[9px] font-black uppercase text-[var(--primary)]">
              {skillName || "Practice"}
            </span>

            {topic && (
              <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase text-[var(--muted)]">
                {topic}
              </span>
            )}

            <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase text-[var(--muted)]">
              {difficulty}
            </span>

          </div>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Learning Mode
              </p>

              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                Practice & Improve
              </h1>

            </div>

            <div className="text-left sm:text-right">

              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Question
              </p>

              <p className="mt-1 text-lg font-black">
                {currentIndex + 1}
                <span className="text-[var(--muted)]">
                  {" "}
                  / {questions.length}
                </span>
              </p>

            </div>

          </div>

        </section>

        {/* ================================================== */}
        {/* PROGRESS */}
        {/* ================================================== */}

        <div className="mt-6">

          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

            <span>
              Progress
            </span>

            <span>
              {progress}%
            </span>

          </div>

          <div className="mt-2 h-1.5 overflow-hidden bg-[var(--surface-soft)]">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress}%`,
              }}
              className="h-full bg-[var(--primary)]"
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mt-5 flex items-center gap-2 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
            <CircleAlert size={15} />
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* QUESTION CARD */}
        {/* ================================================== */}

        <motion.section
          key={currentQuestion.id}
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-8"
        >

          <div className="border border-[var(--border)] bg-[var(--surface)]">

            {/* QUESTION HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-7">

              <div className="flex items-center gap-2">

                <Target
                  size={16}
                  className="text-[var(--primary)]"
                />

                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Question {currentIndex + 1}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <span className="text-[9px] font-black uppercase text-[var(--violet)]">
                  {currentQuestion.difficulty}
                </span>

                <span className="text-[var(--muted)]">
                  •
                </span>

                <span className="text-[9px] font-black uppercase text-[var(--muted)]">
                  {currentQuestion.marks}{" "}
                  {currentQuestion.marks === 1
                    ? "Mark"
                    : "Marks"}
                </span>

              </div>

            </div>

            {/* QUESTION */}

            <div className="px-5 py-7 sm:px-8 sm:py-9">

              <h2 className="max-w-4xl text-lg font-black leading-8 sm:text-xl sm:leading-9">
                {currentQuestion.question_text}
              </h2>

              {/* OPTIONS */}

              <div className="mt-8 space-y-3">

                {currentQuestion.options?.map(
                  (option, index) => {

                    const isSelected =
                      selectedOption ===
                      option.id;

                    const isCorrect =
                      result?.correct &&
                      result.correct_option_id ===
                        option.id;

                    const isWrong =
                      result &&
                      !result.correct &&
                      isSelected;

                    let optionClass =
                      "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/60";

                    if (isSelected && !result) {
                      optionClass =
                        "border-[var(--primary)] bg-[var(--primary-soft)]";
                    }

                    if (isCorrect) {
                      optionClass =
                        "border-[var(--success)] bg-[var(--success)]/10";
                    }

                    if (isWrong) {
                      optionClass =
                        "border-[var(--danger)] bg-[var(--danger)]/10";
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={
                          checking ||
                          Boolean(result)
                        }
                        onClick={() =>
                          setSelectedOption(
                            option.id
                          )
                        }
                        className={`group flex w-full items-center gap-4 border p-4 text-left transition ${optionClass}`}
                      >

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center border text-xs font-black ${
                            isCorrect
                              ? "border-[var(--success)] text-[var(--success)]"
                              : isWrong
                              ? "border-[var(--danger)] text-[var(--danger)]"
                              : isSelected
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-[var(--border)] text-[var(--muted)]"
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span className="flex-1 text-sm font-semibold leading-6">
                          {option.option_text}
                        </span>

                        {isCorrect && (
                          <CheckCircle2
                            size={18}
                            className="shrink-0 text-[var(--success)]"
                          />
                        )}

                        {isWrong && (
                          <XCircle
                            size={18}
                            className="shrink-0 text-[var(--danger)]"
                          />
                        )}

                      </button>
                    );
                  }
                )}

              </div>

              {/* ================================================== */}
              {/* RESULT / EXPLANATION */}
              {/* ================================================== */}

              {result && (

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className={`mt-6 border p-5 ${
                    result.correct
                      ? "border-[var(--success)]/30 bg-[var(--success)]/10"
                      : "border-[var(--danger)]/30 bg-[var(--danger)]/10"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    {result.correct ? (
                      <CheckCircle2
                        size={19}
                        className="text-[var(--success)]"
                      />
                    ) : (
                      <XCircle
                        size={19}
                        className="text-[var(--danger)]"
                      />
                    )}

                    <h3
                      className={`text-sm font-black ${
                        result.correct
                          ? "text-[var(--success)]"
                          : "text-[var(--danger)]"
                      }`}
                    >
                      {result.correct
                        ? "Correct Answer!"
                        : "Not Quite!"}
                    </h3>

                  </div>

                  {!result.correct && (
                    <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                      The correct answer has been
                      highlighted above.
                    </p>
                  )}

                  {result.explanation && (
                    <div className="mt-4 border-t border-current/10 pt-4">

                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">
                        Explanation
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {result.explanation}
                      </p>

                    </div>
                  )}

                </motion.div>

              )}

              {/* ================================================== */}
              {/* ACTIONS */}
              {/* ================================================== */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">

                  <BookOpen size={13} />

                  <span>
                    Practice has no timer.
                    Learn at your own pace.
                  </span>

                </div>

                <div className="flex gap-3">

                  {!result ? (

                    <button
                      onClick={
                        handleCheckAnswer
                      }
                      disabled={
                        !selectedOption ||
                        checking
                      }
                      className="flex min-w-[150px] items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      {checking ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          Checking
                        </>
                      ) : (
                        <>
                          Check Answer
                          <CheckCircle2
                            size={15}
                          />
                        </>
                      )}

                    </button>

                  ) : currentIndex <
                    questions.length - 1 ? (

                    <button
                      onClick={
                        handleNext
                      }
                      className="flex min-w-[150px] items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
                    >
                      Next Question
                      <ArrowRight size={15} />
                    </button>

                  ) : (

                    <button
                      onClick={() =>
                        navigate(
                          "/practice"
                        )
                      }
                      className="flex min-w-[150px] items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
                    >
                      Practice Again
                      <RotateCcw
                        size={15}
                      />
                    </button>

                  )}

                </div>

              </div>

            </div>

          </div>

        </motion.section>

        {/* ================================================== */}
        {/* BATTLE CTA */}
        {/* ================================================== */}

        {result &&
          currentIndex ===
            questions.length - 1 && (

          <motion.section
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-8 overflow-hidden border border-[var(--primary)]/30 bg-[var(--primary-soft)]"
          >

            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">

              <div>

                <div className="flex items-center gap-2">

                  <Swords
                    size={18}
                    className="text-[var(--primary)]"
                  />

                  <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--primary)]">
                    Ready for the next step?
                  </span>

                </div>

                <h2 className="mt-2 text-xl font-black">
                  Think you can handle a Battle?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  You've finished your practice
                  session. When you're confident,
                  enter the Arena and put your
                  knowledge to the test.
                </p>

              </div>

              <button
                onClick={() =>
                  navigate("/battle/setup")
                }
                className="flex shrink-0 items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
              >
                <Swords size={15} />
                Prepare for Battle
                <ArrowRight size={15} />
              </button>

            </div>

          </motion.section>

        )}

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">

          <Zap size={12} />

          Practice • Learn • Improve

        </div>

      </main>

    </div>
  );
}