import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  LockKeyhole,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";

import {
  getAllBadges,
  getMyBadges,
} from "../../services/badgeService";


export default function Achievements() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [badges, setBadges] = useState([]);

  const [earnedBadges, setEarnedBadges] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD BADGES
  // ==========================================================

  useEffect(() => {

    let cancelled = false;

    const loadBadges = async () => {

      try {

        setLoading(true);
        setError("");

        const [
          allBadges,
          myBadges,
        ] = await Promise.all([
          getAllBadges(),
          getMyBadges(),
        ]);

        if (cancelled) {
          return;
        }

        setBadges(
          Array.isArray(allBadges)
            ? allBadges
            : []
        );

        setEarnedBadges(
          Array.isArray(myBadges)
            ? myBadges
            : []
        );

      } catch (err) {

        console.error(
          "Failed to load achievements:",
          err
        );

        if (!cancelled) {

          setError(
            "Unable to load achievements."
          );

          setBadges([]);
          setEarnedBadges([]);
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };

    loadBadges();

    return () => {
      cancelled = true;
    };

  }, []);


  // ==========================================================
  // EARNED BADGE IDS
  // ==========================================================

  const earnedBadgeIds = useMemo(() => {

    return new Set(
      earnedBadges.map(
        (badge) => badge.badge_id
      )
    );

  }, [earnedBadges]);


  // ==========================================================
  // STATS
  // ==========================================================

  const totalBadges = badges.length;

  const unlockedCount =
    earnedBadges.length;

  const lockedCount =
    Math.max(
      totalBadges - unlockedCount,
      0
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Sidebar />

      {/* ====================================================== */}
      {/* MOBILE HEADER */}
      {/* ====================================================== */}

      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:hidden">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">

            <Sparkles
              size={16}
              fill="currentColor"
            />

          </div>

          <span className="text-sm font-black">
            Achievements
          </span>

        </div>

        <ThemeToggle />

      </div>


      {/* ====================================================== */}
      {/* MAIN */}
      {/* ====================================================== */}

      <main className="lg:ml-[245px]">

        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">


          {/* ================================================== */}
          {/* HEADER */}
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
            transition={{
              duration: 0.45,
            }}
          >

            <Link
              to="/dashboard"
              className="mb-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] transition hover:text-[var(--primary)]"
            >

              <ArrowLeft size={14} />

              Back to Dashboard

            </Link>


            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                  Collection
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Achievements
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Complete battles, master skills and
                  unlock achievements as you progress
                  through SkillArena.
                </p>

              </div>


              {/* ================================================= */}
              {/* SUMMARY */}
              {/* ================================================= */}

              <div className="grid grid-cols-3 border border-[var(--border)] bg-[var(--surface)]">

                <div className="border-r border-[var(--border)] px-5 py-4 text-center">

                  <Trophy
                    size={17}
                    className="mx-auto text-[var(--gold)]"
                  />

                  <p className="mt-2 text-lg font-black">
                    {loading
                      ? "..."
                      : totalBadges}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Total
                  </p>

                </div>


                <div className="border-r border-[var(--border)] px-5 py-4 text-center">

                  <CheckCircle2
                    size={17}
                    className="mx-auto text-[var(--success)]"
                  />

                  <p className="mt-2 text-lg font-black">
                    {loading
                      ? "..."
                      : unlockedCount}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Unlocked
                  </p>

                </div>


                <div className="px-5 py-4 text-center">

                  <LockKeyhole
                    size={17}
                    className="mx-auto text-[var(--muted)]"
                  />

                  <p className="mt-2 text-lg font-black">
                    {loading
                      ? "..."
                      : lockedCount}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Locked
                  </p>

                </div>

              </div>

            </div>

          </motion.section>


          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {error && (

            <div className="mt-8 border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">
              {error}
            </div>

          )}


          {/* ================================================== */}
          {/* LOADING */}
          {/* ================================================== */}

          {loading ? (

            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {Array.from({
                length: 6,
              }).map((_, index) => (

                <div
                  key={index}
                  className="h-52 animate-pulse border border-[var(--border)] bg-[var(--surface)]"
                />

              ))}

            </div>

          ) : badges.length === 0 ? (

            /* ================================================== */
            /* EMPTY */
            /* ================================================== */

            <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-14 text-center">

              <Medal
                size={38}
                className="mx-auto text-[var(--muted)]"
              />

              <h2 className="mt-5 text-lg font-black">
                No achievements available
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Achievement badges will appear here
                once they are available.
              </p>

            </div>

          ) : (

            /* ================================================== */
            /* BADGE GRID */
            /* ================================================== */

            <section className="mt-10">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                    Your Collection
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Badge Library
                  </h2>

                </div>

                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

                  <Award size={14} />

                  {unlockedCount}/{totalBadges} earned

                </div>

              </div>


              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                {badges.map(
                  (badge, index) => {

                    const unlocked =
                      earnedBadgeIds.has(
                        badge.id
                      );

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{
                          opacity: 0,
                          y: 18,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index * 0.05,
                        }}
                        whileHover={{
                          y: -4,
                        }}
                        className={`relative overflow-hidden border bg-[var(--surface)] p-6 transition ${
                          unlocked
                            ? "border-[var(--primary)]/40"
                            : "border-[var(--border)]"
                        }`}
                      >

                        {/* TOP ACCENT */}

                        <div
                          className={`absolute left-0 right-0 top-0 h-1 ${
                            unlocked
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--surface-soft)]"
                          }`}
                        />


                        <div className="flex items-start justify-between gap-4">

                          {/* ICON */}

                          <div
                            className={`flex h-16 w-16 shrink-0 items-center justify-center text-3xl ${
                              unlocked
                                ? "bg-[var(--primary-soft)]"
                                : "bg-[var(--surface-soft)] grayscale opacity-50"
                            }`}
                          >

                            {badge.icon || "🏆"}

                          </div>


                          {/* STATUS */}

                          {unlocked ? (

                            <span className="flex items-center gap-1.5 border border-[var(--success)]/20 bg-[var(--success)]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[var(--success)]">

                              <CheckCircle2
                                size={11}
                              />

                              Unlocked

                            </span>

                          ) : (

                            <span className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[var(--muted)]">

                              <LockKeyhole
                                size={11}
                              />

                              Locked

                            </span>

                          )}

                        </div>


                        {/* NAME */}

                        <h3
                          className={`mt-6 text-lg font-black ${
                            unlocked
                              ? "text-[var(--text)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          {badge.name}
                        </h3>


                        {/* DESCRIPTION */}

                        <p className="mt-2 min-h-[42px] text-xs leading-5 text-[var(--muted)]">
                          {badge.description ||
                            "Complete the required challenge to unlock this achievement."}
                        </p>


                        {/* EARNED DATE */}

                        {unlocked && (

                          <div className="mt-5 border-t border-[var(--border)] pt-4">

                            {(() => {

                              const earned =
                                earnedBadges.find(
                                  (item) =>
                                    item.badge_id ===
                                    badge.id
                                );

                              if (!earned) {
                                return null;
                              }

                              const date =
                                new Date(
                                  earned.earned_at
                                );

                              return (
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">

                                  Earned{" "}

                                  {date.toLocaleDateString(
                                    undefined,
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}

                                </p>
                              );

                            })()}

                          </div>

                        )}


                        {/* LOCKED FOOTER */}

                        {!unlocked && (

                          <div className="mt-5 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

                            <LockKeyhole
                              size={12}
                            />

                            Achievement locked

                          </div>

                        )}

                      </motion.div>
                    );
                  }
                )}

              </div>

            </section>

          )}

        </div>

      </main>

    </div>
  );
}