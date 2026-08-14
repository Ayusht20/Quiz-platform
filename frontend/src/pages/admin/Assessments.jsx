import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Plus,
  Search,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getAllAssessments,
} from "../../services/adminAssessmentService";


export default function Assessments() {
  const navigate = useNavigate();

  const [assessments, setAssessments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const loadAssessments = async () => {
    try {
      setLoading(true);

      const data =
        await getAllAssessments();

      setAssessments(data);
    } catch (error) {
      console.error(
        "Failed to load assessments:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAssessments();
  }, []);


  const filteredAssessments =
    assessments.filter((assessment) =>
      assessment.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );


  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Admin Control
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Assessments
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create and manage battles for SkillArena.
            </p>

          </div>


          <button
            onClick={() =>
              navigate("/admin/assessments/create")
            }
            className="flex items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
          >
            <Plus size={16} />
            Create Battle
          </button>

        </div>


        {/* SEARCH */}

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
            placeholder="Search battles..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />

        </div>


        {/* CONTENT */}

        {loading ? (

          <div className="mt-10 text-center text-sm text-[var(--muted)]">
            Loading assessments...
          </div>

        ) : filteredAssessments.length === 0 ? (

          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <Swords
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <h2 className="mt-4 font-black">
              No assessments found
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create your first SkillArena battle.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/admin/assessments/create"
                )
              }
              className="mt-6 bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
            >
              Create Battle
            </button>

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
                    delay: index * 0.05,
                  }}
                  className="border border-[var(--border)] bg-[var(--surface)] p-6"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Swords size={19} />
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[9px] font-black uppercase ${
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


                  <h2 className="mt-5 text-lg font-black">
                    {assessment.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                    {assessment.description ||
                      "No description provided."}
                  </p>


                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="bg-[var(--surface-soft)] p-3">

                      <Clock3
                        size={14}
                        className="text-[var(--muted)]"
                      />

                      <p className="mt-2 text-xs font-black">
                        {assessment.duration_minutes} min
                      </p>

                    </div>


                    <div className="bg-[var(--surface-soft)] p-3">

                      <Trophy
                        size={14}
                        className="text-[var(--muted)]"
                      />

                      <p className="mt-2 text-xs font-black">
                        {assessment.passing_percentage}%
                      </p>

                    </div>

                  </div>


                  <button
                    onClick={() =>
                      navigate(
                        `/admin/assessments/${assessment.id}`
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 border border-[var(--border)] px-4 py-3 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    Manage Battle
                    <ArrowRight size={14} />
                  </button>

                </motion.div>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
}