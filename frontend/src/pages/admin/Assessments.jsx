import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Search,
  Swords,
  Trophy,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  getAllAssessments,
} from "../../services/adminAssessmentService";

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAllAssessments();

      setAssessments(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load generated battles:",
        err
      );

      setError(
        "Unable to load generated battles."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const filteredAssessments =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return assessments;
      }

      return assessments.filter(
        (assessment) =>
          assessment.title
            ?.toLowerCase()
            .includes(value) ||
          assessment.difficulty
            ?.toLowerCase()
            .includes(value) ||
          assessment.topic
            ?.toLowerCase()
            .includes(value)
      );
    }, [assessments, search]);

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Automatic System
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Generated Battles
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Battles are generated automatically when students
            choose a skill and difficulty. Admins do not create
            battles manually.
          </p>

        </div>

        {/* ================================================== */}
        {/* INFO BANNER */}
        {/* ================================================== */}

        <div className="mt-8 border border-[var(--primary)]/20 bg-[var(--primary-soft)] p-5">

          <div className="flex items-start gap-3">

            <Database
              size={18}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
            />

            <div>

              <p className="text-xs font-black">
                How battle generation works
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Question Bank → Skill + Difficulty →
                Random Question Selection → Battle.
                Topics are intentionally not selected during
                battle generation.
              </p>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* SEARCH */}
        {/* ================================================== */}

        <div className="mt-8 flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">

          <Search
            size={17}
            className="text-[var(--muted)]"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search generated battles..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />

        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mt-5 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (

          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <p className="text-sm text-[var(--muted)]">
              Loading generated battles...
            </p>

          </div>

        ) : filteredAssessments.length === 0 ? (

          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <Swords
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <h2 className="mt-4 font-black">
              No generated battles yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              This is normal. Battles will appear here after
              students start playing them.
            </p>

          </div>

        ) : (

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredAssessments.map(
              (assessment, index) => (

                <motion.div
                  key={assessment.id}
                  initial={{
                    opacity: 0,
                    y: 15,
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

                  {/* TOP */}

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Swords size={19} />
                    </div>

                    <span className="bg-[var(--success)]/10 px-2.5 py-1 text-[9px] font-black uppercase text-[var(--success)]">
                      Auto Generated
                    </span>

                  </div>

                  {/* TITLE */}

                  <h2 className="mt-5 text-lg font-black">
                    {assessment.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                    {assessment.description ||
                      "Automatically generated SkillArena battle."}
                  </p>

                  {/* DETAILS */}

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="bg-[var(--surface-soft)] p-3">

                      <p className="text-[9px] font-black uppercase text-[var(--muted)]">
                        Difficulty
                      </p>

                      <p className="mt-2 text-xs font-black">
                        {assessment.difficulty ||
                          "—"}
                      </p>

                    </div>

                    <div className="bg-[var(--surface-soft)] p-3">

                      <p className="text-[9px] font-black uppercase text-[var(--muted)]">
                        Questions
                      </p>

                      <p className="mt-2 text-xs font-black">
                        {assessment.question_count ||
                          "—"}
                      </p>

                    </div>

                    <div className="bg-[var(--surface-soft)] p-3">

                      <Clock3
                        size={14}
                        className="text-[var(--muted)]"
                      />

                      <p className="mt-2 text-xs font-black">
                        {assessment.duration_minutes ||
                          "—"}{" "}
                        min
                      </p>

                    </div>

                    <div className="bg-[var(--surface-soft)] p-3">

                      <Trophy
                        size={14}
                        className="text-[var(--muted)]"
                      />

                      <p className="mt-2 text-xs font-black">
                        {assessment.passing_percentage ||
                          60}
                        %
                      </p>

                    </div>

                  </div>

                  {/* TOPIC */}

                  {assessment.topic && (
                    <div className="mt-4">

                      <span className="inline-block border border-[var(--border)] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                        Topic: {assessment.topic}
                      </span>

                    </div>
                  )}

                </motion.div>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
}