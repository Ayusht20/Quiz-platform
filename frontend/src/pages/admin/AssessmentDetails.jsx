import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Swords,
  Trophy,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../api/axios";

export default function AssessmentDetails() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD BATTLE
  // ============================================================

  useEffect(() => {
    loadBattle();
  }, [assessmentId]);

  const loadBattle = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all admin assessments
      const assessmentResponse = await api.get(
        "/assessments/admin/all"
      );

      const foundAssessment =
        assessmentResponse.data.find(
          (item) =>
            item.id === Number(assessmentId)
        );

      if (!foundAssessment) {
        setError("Battle not found.");
        return;
      }

      setAssessment(foundAssessment);

      // ========================================================
      // LOAD QUESTIONS ALREADY ATTACHED TO THIS BATTLE
      // ========================================================

      const questionsResponse =
        await api.get(
          `/assessments/${assessmentId}/questions`
        );

      setQuestions(
        questionsResponse.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load battle:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load battle."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PUBLISH
  // ============================================================

  const publishBattle = async () => {
    if (questions.length === 0) {
      setError(
        "You cannot publish a battle without questions."
      );

      return;
    }

    try {
      setPublishing(true);
      setError("");

      await api.patch(
        `/assessments/${assessmentId}/publish`
      );

      await loadBattle();
    } catch (err) {
      console.error(
        "Failed to publish battle:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to publish battle."
      );
    } finally {
      setPublishing(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading battle...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR / NOT FOUND
  // ============================================================

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">

          <button
            onClick={() =>
              navigate("/admin/assessments")
            }
            className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={17} />
            Back to Assessments
          </button>

          <div className="mt-10 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-6">
            <p className="text-sm font-semibold text-[var(--danger)]">
              {error || "Battle not found."}
            </p>
          </div>

        </main>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate("/admin/assessments")
            }
            className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft size={17} />

            Assessments
          </button>

          <div className="flex items-center gap-2">

            <Swords
              size={19}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              SkillArena
            </span>

          </div>

        </div>


        {/* ================================================== */}
        {/* TITLE */}
        {/* ================================================== */}

        <section className="mt-10">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Battle Management
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-3xl font-black sm:text-4xl">
                  {assessment.title}
                </h1>

                <span
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                    assessment.is_published
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >
                  {assessment.is_published
                    ? "Published"
                    : "Draft"}
                </span>

              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {assessment.description ||
                  "Review your battle before publishing it to students."}
              </p>

            </div>


            {/* PUBLISH */}

            {!assessment.is_published && (
              <button
                onClick={publishBattle}
                disabled={
                  publishing ||
                  questions.length === 0
                }
                className="flex shrink-0 items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >

                {publishing ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                    Publishing...
                  </>
                ) : (
                  <>
                    <Check size={15} />

                    Publish Battle
                  </>
                )}

              </button>
            )}

          </div>

        </section>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mt-6 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}


        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          {/* DURATION */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

            <Clock3
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-xs text-[var(--muted)]">
              Duration
            </p>

            <p className="mt-1 text-lg font-black">
              {assessment.duration_minutes} min
            </p>

          </div>


          {/* PASSING */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

            <Trophy
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-xs text-[var(--muted)]">
              Passing
            </p>

            <p className="mt-1 text-lg font-black">
              {assessment.passing_percentage}%
            </p>

          </div>


          {/* QUESTIONS */}

          <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

            <Swords
              size={18}
              className="text-[var(--primary)]"
            />

            <p className="mt-3 text-xs text-[var(--muted)]">
              Questions
            </p>

            <p className="mt-1 text-lg font-black">
              {questions.length}
            </p>

          </div>

        </div>


        {/* ================================================== */}
        {/* QUESTIONS */}
        {/* ================================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Battle Questions
              </p>

              <h2 className="mt-2 text-xl font-black">
                Questions in this battle
              </h2>

              <p className="mt-2 text-sm text-[var(--muted)]">
                These are the questions selected during
                battle creation.
              </p>

            </div>

          </div>


          {/* EMPTY */}

          {questions.length === 0 ? (

            <div className="mt-6 border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">

              <Swords
                size={30}
                className="mx-auto text-[var(--muted)]"
              />

              <h3 className="mt-4 font-black">
                No questions attached
              </h3>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Something went wrong while loading the
                questions attached to this battle.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {questions.map(
                (question, index) => (

                  <motion.article
                    key={
                      question.id ??
                      question.question_id
                    }
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
                    className="border border-[var(--border)] bg-[var(--surface)] p-6"
                  >

                    <div className="flex gap-5">

                      {/* NUMBER */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>


                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">
                            Question {index + 1}
                          </span>

                          {question.difficulty && (
                            <span className="text-[9px] font-black uppercase text-[var(--muted)]">
                              {question.difficulty}
                            </span>
                          )}

                          {question.marks !== undefined && (
                            <span className="text-[9px] font-black text-[var(--muted)]">
                              {question.marks}{" "}
                              {question.marks === 1
                                ? "mark"
                                : "marks"}
                            </span>
                          )}

                        </div>


                        <p className="mt-3 text-sm font-bold leading-6">
                          {question.question_text}
                        </p>


                        {/* OPTIONS */}

                        {question.options?.length > 0 && (
                          <div className="mt-5 grid gap-2 md:grid-cols-2">

                            {question.options.map(
                              (
                                option,
                                optionIndex
                              ) => (

                                <div
                                  key={option.id}
                                  className={`border p-3 text-xs ${
                                    option.is_correct
                                      ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                                      : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                                  }`}
                                >

                                  <span className="mr-2 font-black">
                                    {String.fromCharCode(
                                      65 +
                                        optionIndex
                                    )}
                                    .
                                  </span>

                                  {option.option_text}

                                  {option.is_correct && (
                                    <Check
                                      size={13}
                                      className="ml-2 inline"
                                    />
                                  )}

                                </div>

                              )
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  </motion.article>

                )
              )}

            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* FOOTER ACTION */}
        {/* ================================================== */}

        <div className="mt-10 flex justify-between border-t border-[var(--border)] pt-6">

          <button
            onClick={() =>
              navigate("/admin/assessments")
            }
            className="flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)]"
          >
            <ArrowLeft size={15} />

            Back
          </button>

          {!assessment.is_published &&
            questions.length > 0 && (
              <button
                onClick={publishBattle}
                disabled={publishing}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <Check size={15} />

                {publishing
                  ? "Publishing..."
                  : "Publish Battle"}
              </button>
            )}

        </div>

      </main>

    </div>
  );
}