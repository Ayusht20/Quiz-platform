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


export default function Practice() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);


  // ============================================================
  // LOAD PRACTICE QUESTIONS
  // ============================================================

  const loadPractice = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPracticeQuestions({
        limit: 10,
      });

      setQuestions(data || []);
      setCurrentIndex(0);
      setSelectedOption(null);
      setResult(null);
      setFinished(false);
      setCorrectCount(0);
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


  // ============================================================
  // LOAD BATTLES
  // ============================================================

  const loadBattles = async () => {
    try {
      const data = await getAssessments();

      setAssessments(data || []);
    } catch (err) {
      console.error(
        "Failed to load battles:",
        err
      );
    }
  };


  useEffect(() => {
    loadPractice();
    loadBattles();
  }, []);


  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const currentQuestion =
    questions[currentIndex];


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

      const data =
        await checkPracticeAnswer(
          currentQuestion.id,
          selectedOption
        );

      setResult(data);

      if (data.correct) {
        setCorrectCount(
          (previous) => previous + 1
        );
      }
    } catch (err) {
      console.error(
        "Failed to check answer:",
        err
      );

      setError(
        "Unable to check this answer."
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
  // LOADING
  // ============================================================

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
            Loading Practice
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text)]">

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        <div className="mx-auto mt-20 max-w-lg border border-[var(--danger)]/20 bg-[var(--surface)] p-10 text-center">

          <CircleAlert
            size={36}
            className="mx-auto text-[var(--danger)]"
          />

          <h2 className="mt-5 text-lg font-black">
            Practice unavailable
          </h2>

          <p className="mt-2 text-sm text-[var(--muted)]">
            {error}
          </p>

          <button
            onClick={loadPractice}
            className="mt-6 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase text-white"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // ============================================================
  // NO QUESTIONS
  // ============================================================

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto max-w-3xl px-5 py-10">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="mt-16 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <Trophy
              size={38}
              className="mx-auto text-[var(--muted)]"
            />

            <h1 className="mt-5 text-xl font-black">
              No practice questions yet
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Ask the admin to add active questions
              to the question bank.
            </p>

          </div>

        </main>

      </div>
    );
  }


  // ============================================================
  // PRACTICE COMPLETE
  // ============================================================

  if (finished) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <main className="mx-auto max-w-4xl px-5 py-10 lg:py-16">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-12 border border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12"
          >

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">

              <Trophy size={38} />

            </div>

            <p className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Practice Complete
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Good work!
            </h1>

            <p className="mt-3 text-sm text-[var(--muted)]">
              You answered{" "}
              <span className="font-black text-[var(--text)]">
                {correctCount}
              </span>{" "}
              out of{" "}
              <span className="font-black text-[var(--text)]">
                {questions.length}
              </span>{" "}
              questions correctly.
            </p>


            <div className="mx-auto mt-8 max-w-md">

              <div className="mb-2 flex justify-between text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

                <span>
                  Accuracy
                </span>

                <span>
                  {Math.round(
                    (correctCount /
                      questions.length) *
                      100
                  )}
                  %
                </span>

              </div>

              <div className="h-2 overflow-hidden bg-[var(--surface-soft)]">

                <div
                  className="h-full bg-[var(--primary)] transition-all"
                  style={{
                    width: `${
                      (correctCount /
                        questions.length) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>


            {/* BATTLE CTA */}

            <div className="mt-10 border border-[var(--primary)]/20 bg-[var(--primary-soft)] p-6">

              <div className="flex items-center justify-center gap-2 text-[var(--primary)]">

                <Swords size={18} />

                <span className="text-xs font-black uppercase tracking-wider">
                  Ready for Battle?
                </span>

              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Put your knowledge to the test in an
                official SkillArena battle.
              </p>


              {assessments.length > 0 ? (

                <button
                  onClick={() =>
                    navigate(
                      `/practice/${assessments[0].id}`
                    )
                  }
                  className="mt-5 inline-flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
                >
                  Enter Battle
                  <ArrowRight size={15} />
                </button>

              ) : (

                <p className="mt-4 text-xs text-[var(--muted)]">
                  No battles are currently available.
                </p>

              )}

            </div>


            <button
              onClick={loadPractice}
              className="mt-6 inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider text-[var(--muted)] transition hover:text-[var(--text)]"
            >
              <RotateCcw size={14} />
              Practice Again
            </button>

          </motion.div>

        </main>

      </div>
    );
  }


  // ============================================================
  // QUESTION SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-4xl px-5 py-8 lg:py-12">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Dashboard
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

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Question {currentIndex + 1}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                of {questions.length}
              </p>

            </div>

            <span className="text-xs font-black text-[var(--muted)]">
              {Math.round(
                ((currentIndex + 1) /
                  questions.length) *
                  100
              )}
              %
            </span>

          </div>

          <div className="mt-3 h-1.5 bg-[var(--surface-soft)]">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${
                  ((currentIndex + 1) /
                    questions.length) *
                  100
                }%`,
              }}
              className="h-full bg-[var(--primary)]"
            />

          </div>

        </div>


        {/* QUESTION */}

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
          className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
        >

          <div className="flex items-center justify-between gap-4">

            <span className="bg-[var(--primary-soft)] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">
              {currentQuestion.difficulty}
            </span>

            {currentQuestion.topic && (
              <span className="text-[10px] font-bold text-[var(--muted)]">
                {currentQuestion.topic}
              </span>
            )}

          </div>


          <h1 className="mt-7 text-xl font-black leading-relaxed sm:text-2xl">
            {currentQuestion.question_text}
          </h1>


          {/* OPTIONS */}

          <div className="mt-8 space-y-3">

            {currentQuestion.options.map(
              (option, index) => {

                const isSelected =
                  selectedOption ===
                  option.id;

                const isCorrect =
                  result &&
                  result.correct_option_id ===
                    option.id;

                const isWrong =
                  result &&
                  isSelected &&
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
                      isCorrect
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : isWrong
                        ? "border-[var(--danger)] bg-[var(--danger)]/10"
                        : isSelected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                    }`}
                  >

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--border)] text-xs font-black">

                      {String.fromCharCode(
                        65 + index
                      )}

                    </span>

                    <span className="flex-1 text-sm font-semibold">
                      {option.option_text}
                    </span>

                    {isCorrect && (
                      <CheckCircle2
                        size={18}
                        className="text-[var(--success)]"
                      />
                    )}

                    {isWrong && (
                      <XCircle
                        size={18}
                        className="text-[var(--danger)]"
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>


          {/* RESULT */}

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

                <p className="text-sm font-black">

                  {result.correct
                    ? "Correct!"
                    : "Not quite!"}

                </p>

              </div>

              {result.explanation && (

                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {result.explanation}
                </p>

              )}

            </motion.div>

          )}


          {/* ACTION */}

          <div className="mt-7 flex justify-end">

            {!result ? (

              <button
                disabled={!selectedOption || checking}
                onClick={handleCheckAnswer}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking
                  ? "Checking..."
                  : "Check Answer"}

                <CheckCircle2 size={15} />

              </button>

            ) : (

              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
              >
                {currentIndex ===
                questions.length - 1
                  ? "Finish Practice"
                  : "Next Question"}

                <ArrowRight size={15} />

              </button>

            )}

          </div>

        </motion.section>

      </main>

    </div>
  );
}