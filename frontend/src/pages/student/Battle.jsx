import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Flag,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

import {
  startAssessment,
  getAttempt,
  submitAttempt,
} from "../../services/assessmentService";


export default function Battle() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();

  // ─────────────────────────────────────────────
  // BATTLE STATE
  // ─────────────────────────────────────────────

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  /*
    answers structure:

    {
      1: 12,
      2: 17,
      3: 21
    }

    question_id : selected_option_id
  */
  const [answers, setAnswers] = useState({});

  const [flagged, setFlagged] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] = useState(null);


  // ─────────────────────────────────────────────
  // CURRENT QUESTION
  // ─────────────────────────────────────────────

  const question = questions[currentQuestion];


  // ─────────────────────────────────────────────
  // ANSWERED COUNT
  // ─────────────────────────────────────────────

  const answeredCount = Object.keys(answers).length;


  // ─────────────────────────────────────────────
  // PROGRESS
  // ─────────────────────────────────────────────

  const progress =
    questions.length > 0
      ? ((currentQuestion + 1) / questions.length) * 100
      : 0;


  // ─────────────────────────────────────────────
  // TIMER DISPLAY
  // ─────────────────────────────────────────────

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (timeLeft % 60)
    .toString()
    .padStart(2, "0");


  // ─────────────────────────────────────────────
  // LOAD BATTLE
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const initializeBattle = async () => {
      try {
        setLoading(true);
        setError("");

        // Start / resume the attempt
        const startedAttempt =
          await startAssessment(assessmentId);

        if (cancelled) return;

        setAttempt(startedAttempt);

        // Load questions belonging to this attempt
        const attemptData =
          await getAttempt(
            startedAttempt.attempt_id
          );

        if (cancelled) return;

        setQuestions(
          attemptData.questions || []
        );

        // Backend-controlled expiry
        updateTimer(
          attemptData.expires_at
        );
      } catch (err) {
        console.error(
          "Failed to initialize battle:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "Unable to start this battle."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeBattle();

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);


  // ─────────────────────────────────────────────
  // BACKEND TIMER
  // ─────────────────────────────────────────────

  const updateTimer = (expiresAt) => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    const expiry =
      new Date(expiresAt).getTime();

    const remaining = Math.max(
      0,
      Math.floor(
        (expiry - Date.now()) / 1000
      )
    );

    setTimeLeft(remaining);
  };


  // ─────────────────────────────────────────────
  // COUNTDOWN
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (
      !attempt?.expires_at ||
      result ||
      submitting
    ) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor(
          (
            new Date(
              attempt.expires_at
            ).getTime() - Date.now()
          ) / 1000
        )
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);

        handleSubmit(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [attempt, result, submitting]);


  // ─────────────────────────────────────────────
  // SELECT ANSWER
  // ─────────────────────────────────────────────

  const selectAnswer = (optionId) => {
    if (submitting || result || !question) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [question.id]: optionId,
    }));
  };


  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────

  const nextQuestion = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (value) => value + 1
      );
    }
  };


  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (value) => value - 1
      );
    }
  };


  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };


  // ─────────────────────────────────────────────
  // FLAG QUESTION
  // ─────────────────────────────────────────────

  const toggleFlag = () => {
    if (!question) return;

    setFlagged((previous) =>
      previous.includes(question.id)
        ? previous.filter(
            (id) => id !== question.id
          )
        : [...previous, question.id]
    );
  };


  // ─────────────────────────────────────────────
  // SUBMIT BATTLE
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    automatic = false
  ) => {
    if (
      submitting ||
      result ||
      !attempt
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      /*
        Convert:

        {
          1: 12,
          2: 18
        }

        into backend format:

        [
          {
            question_id: 1,
            selected_option_id: 12
          },
          {
            question_id: 2,
            selected_option_id: 18
          }
        ]
      */

      const payload = Object.entries(
        answers
      ).map(
        ([questionId, optionId]) => ({
          question_id: Number(
            questionId
          ),
          selected_option_id: Number(
            optionId
          ),
        })
      );

      const resultData =
        await submitAttempt(
          attempt.attempt_id,
          payload
        );

      setResult(resultData);

      /*
        If timeout triggered the submission,
        make sure timer displays zero.
      */
      if (automatic) {
        setTimeLeft(0);
      }
    } catch (err) {
      console.error(
        "Failed to submit battle:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to submit battle."
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ─────────────────────────────────────────────
  // QUESTION RESULT HELPERS
  // ─────────────────────────────────────────────

  const isAnswered = (questionId) =>
    answers[questionId] !== undefined;


  // ─────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="arena-background flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">

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
            Preparing Battle
          </p>

          <p className="mt-2 text-[10px] text-[var(--muted)]">
            Loading your questions...
          </p>

        </div>

      </div>
    );
  }


  // ─────────────────────────────────────────────
  // ERROR SCREEN
  // ─────────────────────────────────────────────

  if (error && !question && !result) {
    return (
      <div className="arena-background flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 text-[var(--text)]">

        <div className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
            <X size={25} />
          </div>

          <h1 className="mt-5 text-xl font-black">
            Battle unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/practice")
            }
            className="mt-6 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white"
          >
            Back to Arena
          </button>

        </div>

      </div>
    );
  }


  // ─────────────────────────────────────────────
  // RESULT SCREEN
  // ─────────────────────────────────────────────

  if (result) {
    return (
      <BattleResult
        result={result}
        onBack={() =>
          navigate("/practice")
        }
      />
    );
  }


  // ─────────────────────────────────────────────
  // NO QUESTIONS
  // ─────────────────────────────────────────────

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">

        <div className="text-center">

          <p className="text-lg font-black">
            No questions found
          </p>

          <button
            onClick={() =>
              navigate("/practice")
            }
            className="mt-5 bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
          >
            Back to Arena
          </button>

        </div>

      </div>
    );
  }


  // ─────────────────────────────────────────────
  // MAIN BATTLE UI
  // ─────────────────────────────────────────────

  return (
    <div className="arena-background min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ───────────────────────────────────────
          TOP BAR
      ─────────────────────────────────────── */}

      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-5 py-4">

          <div className="flex items-center justify-between">

            <button
              onClick={() =>
                navigate("/practice")
              }
              disabled={submitting}
              className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--text)] disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Exit Battle
            </button>

            <div className="flex items-center gap-2">

              <Swords
                size={17}
                className="text-[var(--primary)]"
              />

              <span className="max-w-[180px] truncate text-xs font-black uppercase tracking-[0.18em] sm:max-w-none">
                Battle Arena
              </span>

            </div>

            <div
              className={`flex items-center gap-2 font-mono text-sm font-black ${
                timeLeft <= 60
                  ? "text-[var(--danger)]"
                  : "text-[var(--cyan)]"
              }`}
            >
              <Clock3 size={16} />
              {minutes}:{seconds}
            </div>

          </div>

        </div>

        {/* PROGRESS BAR */}

        <div className="h-1 bg-[var(--surface-soft)]">

          <motion.div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--violet)]"
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 0.35,
            }}
          />

        </div>

      </header>


      {/* ───────────────────────────────────────
          MAIN
      ─────────────────────────────────────── */}

      <main className="mx-auto max-w-6xl px-5 py-8 lg:py-12">

        {/* BATTLE HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
              Live Battle
            </p>

            <h1 className="mt-2 max-w-2xl text-2xl font-black sm:text-3xl">
              Assessment #{assessmentId}
            </h1>

            <p className="mt-2 text-xs text-[var(--muted)]">
              Attempt #{attempt?.attempt_id}
            </p>

          </div>


          <div className="flex items-center gap-5">

            <div className="text-right">

              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Answered
              </p>

              <p className="mt-1 text-sm font-black">

                {answeredCount}

                <span className="text-[var(--muted)]">
                  {" "} / {questions.length}
                </span>

              </p>

            </div>


            <div className="h-8 w-px bg-[var(--border)]" />


            <div className="text-right">

              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Battle
              </p>

              <p className="mt-1 flex items-center gap-1 text-sm font-black text-[var(--cyan)]">
                <Zap size={13} />
                XP
              </p>

            </div>

          </div>

        </div>


        {/* ERROR BANNER */}

        {error && (
          <div className="mb-6 border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-xs font-semibold text-[var(--danger)]">
            {error}
          </div>
        )}


        {/* QUESTION + MAP */}

        <div className="grid gap-6 lg:grid-cols-[1fr_230px]">


          {/* QUESTION */}

          <section className="border border-[var(--border)] bg-[var(--surface)]">

            <div className="border-b border-[var(--border)] px-6 py-5">

              <div className="flex items-center justify-between gap-4">

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">

                  Question{" "}

                  {String(
                    currentQuestion + 1
                  ).padStart(2, "0")}

                  {" / "}

                  {String(
                    questions.length
                  ).padStart(2, "0")}

                </p>


                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition ${
                    flagged.includes(
                      question.id
                    )
                      ? "text-[var(--orange)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >

                  <Flag size={14} />

                  {flagged.includes(
                    question.id
                  )
                    ? "Flagged"
                    : "Flag"}

                </button>

              </div>

            </div>


            <div className="p-6 sm:p-10">

              <AnimatePresence mode="wait">

                <motion.div
                  key={question.id}
                  initial={{
                    opacity: 0,
                    x: 25,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -25,
                  }}
                  transition={{
                    duration: 0.22,
                  }}
                >

                  {/* QUESTION */}

                  <div className="flex items-start gap-4">

                    <div className="hidden h-9 w-9 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)] sm:flex">

                      <Swords size={16} />

                    </div>

                    <div>

                      <p className="mb-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                        {question.difficulty}
                        {" • "}
                        {question.marks}{" "}
                        {question.marks === 1
                          ? "mark"
                          : "marks"}
                      </p>

                      <h2 className="max-w-3xl text-xl font-black leading-relaxed sm:text-2xl">
                        {question.question_text}
                      </h2>

                    </div>

                  </div>


                  {/* OPTIONS */}

                  <div className="mt-8 space-y-3">

                    {question.options.map(
                      (option, index) => {

                        const selected =
                          answers[
                            question.id
                          ] === option.id;

                        return (
                          <motion.button
                            key={option.id}
                            whileHover={{
                              x: 4,
                            }}
                            whileTap={{
                              scale: 0.99,
                            }}
                            onClick={() =>
                              selectAnswer(
                                option.id
                              )
                            }
                            disabled={submitting}
                            className={`group flex w-full items-center gap-4 border p-4 text-left transition-all ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-soft)]"
                            }`}
                          >

                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center border text-xs font-black transition ${
                                selected
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                  : "border-[var(--border)] text-[var(--muted)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)]"
                              }`}
                            >
                              {String.fromCharCode(
                                65 + index
                              )}
                            </span>


                            <span className="text-sm font-semibold">
                              {
                                option.option_text
                              }
                            </span>


                            {selected && (
                              <Check
                                size={17}
                                className="ml-auto text-[var(--primary)]"
                              />
                            )}

                          </motion.button>
                        );
                      }
                    )}

                  </div>

                </motion.div>

              </AnimatePresence>

            </div>


            {/* NAVIGATION */}

            <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-5">

              <button
                onClick={previousQuestion}
                disabled={
                  currentQuestion === 0 ||
                  submitting
                }
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft size={15} />
                Previous
              </button>


              {currentQuestion ===
              questions.length - 1 ? (

                <motion.button
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={() =>
                    handleSubmit(false)
                  }
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {submitting
                    ? "Submitting..."
                    : "Finish Battle"}

                  {!submitting && (
                    <Swords size={15} />
                  )}

                </motion.button>

              ) : (

                <motion.button
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={nextQuestion}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
                >
                  Next
                  <ArrowRight size={15} />
                </motion.button>

              )}

            </div>

          </section>


          {/* ─────────────────────────────────
              QUESTION MAP
          ───────────────────────────────── */}

          <aside className="border border-[var(--border)] bg-[var(--surface)] p-5">

            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Battle Map
            </p>

            <p className="mt-1 text-xs font-bold">
              Questions
            </p>


            <div className="mt-5 grid grid-cols-5 gap-2">

              {questions.map(
                (item, index) => {

                  const answered =
                    isAnswered(item.id);

                  const active =
                    index === currentQuestion;

                  const isFlagged =
                    flagged.includes(
                      item.id
                    );

                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        goToQuestion(index)
                      }
                      disabled={submitting}
                      className={`relative flex h-9 items-center justify-center text-[10px] font-black transition ${
                        active
                          ? "bg-[var(--primary)] text-white"
                          : answered
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >

                      {index + 1}

                      {isFlagged && (
                        <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--orange)]" />
                      )}

                    </button>
                  );
                }
              )}

            </div>


            {/* LEGEND */}

            <div className="mt-7 border-t border-[var(--border)] pt-5">

              <div className="space-y-3 text-[10px]">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 bg-[var(--primary)]" />

                  <span className="text-[var(--muted)]">
                    Current
                  </span>

                </div>


                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 bg-[var(--primary-soft)]" />

                  <span className="text-[var(--muted)]">
                    Answered
                  </span>

                </div>


                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 bg-[var(--surface-soft)]" />

                  <span className="text-[var(--muted)]">
                    Unanswered
                  </span>

                </div>

              </div>

            </div>


            {/* TIMER */}

            <div className="mt-8 border-t border-[var(--border)] pt-5">

              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Time remaining
              </p>

              <p
                className={`mt-2 font-mono text-2xl font-black ${
                  timeLeft <= 60
                    ? "text-[var(--danger)]"
                    : "text-[var(--cyan)]"
                }`}
              >
                {minutes}:{seconds}
              </p>

              {timeLeft <= 60 && (
                <p className="mt-1 text-[9px] font-bold text-[var(--danger)]">
                  Hurry! Time is running out.
                </p>
              )}

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}


/* ═══════════════════════════════════════════════
   RESULT SCREEN
═══════════════════════════════════════════════ */

function BattleResult({
  result,
  onBack,
}) {
  const passed =
    result.status === "COMPLETED" &&
    result.percentage >= 60;

  const timeTakenMinutes = Math.floor(
    (result.time_taken_seconds || 0) / 60
  );

  const timeTakenSeconds =
    (result.time_taken_seconds || 0) % 60;


  return (
    <div className="arena-background flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 py-10 text-[var(--text)]">

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center sm:p-12"
      >

        {/* RESULT ICON */}

        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 180,
          }}
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            passed
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--danger)]/10 text-[var(--danger)]"
          }`}
        >
          {passed ? (
            <Trophy size={34} />
          ) : (
            <X size={34} />
          )}
        </motion.div>


        <p className="mt-7 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">
          Battle Complete
        </p>


        <h1 className="mt-2 text-3xl font-black">
          {passed
            ? "Victory!"
            : result.status === "TIME_EXPIRED"
            ? "Time's Up!"
            : "Battle Over"}
        </h1>


        <p className="mt-2 text-sm text-[var(--muted)]">
          {passed
            ? "Excellent work. Your skills are getting stronger."
            : result.status ===
              "TIME_EXPIRED"
            ? "The clock ran out. Keep practicing and come back stronger."
            : "Keep practicing. Your next victory is closer."}
        </p>


        {/* MAIN STATS */}

        <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8 sm:gap-10">

          <div>

            <p className="text-4xl font-black">
              {result.percentage}%
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--muted)]">
              Score
            </p>

          </div>


          <div className="h-12 w-px bg-[var(--border)]" />


          <div>

            <p className="flex items-center justify-center gap-1 text-4xl font-black text-[var(--cyan)]">

              <Zap size={24} />

              {result.xp_earned}

            </p>

            <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--muted)]">
              XP Earned
            </p>

          </div>

        </div>


        {/* LEVEL */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
          }}
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4"
        >

          <Zap
            size={16}
            className="text-[var(--primary)]"
          />

          <span className="text-xs font-bold text-[var(--muted)]">
            Current Level
          </span>

          <span className="text-sm font-black">
            {result.current_level}
          </span>

        </motion.div>


        {/* DETAILED STATS */}

        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4">

          <div className="border-b border-[var(--border)] p-4 sm:border-b-0 sm:border-r">

            <p className="font-black text-[var(--success)]">
              {result.correct_answers}
            </p>

            <p className="mt-1 text-[9px] text-[var(--muted)]">
              Correct
            </p>

          </div>


          <div className="border-b border-[var(--border)] p-4 sm:border-b-0 sm:border-r">

            <p className="font-black text-[var(--danger)]">
              {result.incorrect_answers}
            </p>

            <p className="mt-1 text-[9px] text-[var(--muted)]">
              Incorrect
            </p>

          </div>


          <div className="border-r border-[var(--border)] p-4">

            <p className="font-black">
              {result.unanswered}
            </p>

            <p className="mt-1 text-[9px] text-[var(--muted)]">
              Skipped
            </p>

          </div>


          <div className="p-4">

            <p className="font-black">
              {String(
                timeTakenMinutes
              ).padStart(2, "0")}
              :
              {String(
                timeTakenSeconds
              ).padStart(2, "0")}
            </p>

            <p className="mt-1 text-[9px] text-[var(--muted)]">
              Time Taken
            </p>

          </div>

        </div>


        {/* STATUS */}

        <div
          className={`mx-auto mt-6 inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
            passed
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--danger)]/10 text-[var(--danger)]"
          }`}
        >

          {passed ? (
            <Check size={14} />
          ) : (
            <X size={14} />
          )}

          {result.status ===
          "TIME_EXPIRED"
            ? "Time Expired"
            : passed
            ? "Passed"
            : "Failed"}

        </div>


        {/* ACTION */}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <button
            onClick={onBack}
            className="bg-[var(--primary)] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
          >
            Return to Arena
          </button>

        </div>

      </motion.div>

    </div>
  );
}