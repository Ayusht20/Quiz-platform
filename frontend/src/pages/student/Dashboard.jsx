import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Flame,
  Trophy,
  Zap,
  Swords,
  ChevronRight,
  LockKeyhole,
  Target,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

import { getMyQuests } from "../../services/questService";
import { getMySkillProgress } from "../../services/skillService";

// ============================================================
// FALLBACK COLORS
// ============================================================

const skillColors = [
  "var(--primary)",
  "var(--violet)",
  "var(--cyan)",
  "var(--orange)",
];

// ============================================================
// STATIC DEMO DATA
// ============================================================

const battles = [
  {
    title: "JavaScript Arrays",
    category: "JavaScript",
    score: "86%",
    xp: "+120",
  },
  {
    title: "Python Fundamentals",
    category: "Python",
    score: "78%",
    xp: "+100",
  },
  {
    title: "React Components",
    category: "React",
    score: "72%",
    xp: "+80",
  },
];

const leaderboard = [
  {
    rank: 124,
    name: "Rahul",
    xp: 5210,
  },
  {
    rank: 125,
    name: "Priya",
    xp: 4890,
  },
];

// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [skillProgress, setSkillProgress] = useState([]);
  const [quests, setQuests] = useState([]);

  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingQuests, setLoadingQuests] = useState(true);

  // ==========================================================
  // USER
  // ==========================================================

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;

  const firstName =
    user?.name?.split(" ")[0] || "Player";

  // ==========================================================
  // XP PROGRESS
  // ==========================================================

  const xpIntoLevel = xp % 1000;

  const xpProgress = Math.min(
    (xpIntoLevel / 1000) * 100,
    100
  );

  // ==========================================================
  // LOAD SKILL PROGRESS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadSkills = async () => {
      try {
        setLoadingSkills(true);

        const data = await getMySkillProgress();

        if (!cancelled) {
          setSkillProgress(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load skill progress:",
          error
        );

        if (!cancelled) {
          setSkillProgress([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSkills(false);
        }
      }
    };

    loadSkills();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOAD QUESTS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadQuests = async () => {
      try {
        setLoadingQuests(true);

        const data = await getMyQuests();

        if (!cancelled) {
          setQuests(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load quests:",
          error
        );

        if (!cancelled) {
          setQuests([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingQuests(false);
        }
      }
    };

    loadQuests();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // NORMALIZE SKILL DATA
  // ==========================================================

  const skills = useMemo(() => {
    return skillProgress
      .slice(0, 4)
      .map((skill, index) => {
        const name =
          skill.skill_name ||
          skill.name ||
          skill.skill?.name ||
          `Skill ${index + 1}`;

        const answered =
          skill.questions_answered ?? 0;

        const correct =
          skill.questions_correct ?? 0;

        const progress =
          skill.progress ??
          skill.percentage ??
          (
            answered > 0
              ? Math.round(
                  (correct / answered) * 100
                )
              : 0
          );

        const completed =
          skill.completed ?? false;

        const mastered =
          skill.mastered ?? false;

        return {
          id:
            skill.skill_id ??
            skill.skill?.id ??
            index,

          name,

          short: name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),

          progress: Math.min(
            Math.max(progress, 0),
            100
          ),

          completed,
          mastered,

          unlocked:
            completed ||
            answered > 0 ||
            progress > 0,

          color:
            skillColors[
              index % skillColors.length
            ],
        };
      });
  }, [skillProgress]);

  // ==========================================================
  // QUEST SUMMARY
  // ==========================================================

  const activeQuests = useMemo(() => {
    return quests.filter(
      (quest) =>
        !quest.completed &&
        !quest.reward_claimed
    );
  }, [quests]);

  const featuredQuest =
    activeQuests[0] ||
    quests[0] ||
    null;

  // ==========================================================
  // QUEST PROGRESS %
  // ==========================================================

  const questProgress = featuredQuest
    ? Math.min(
        (
          featuredQuest.progress /
          Math.max(
            featuredQuest.target_value,
            1
          )
        ) * 100,
        100
      )
    : 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="arena-background min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Sidebar />

      {/* ====================================================== */}
      {/* MOBILE HEADER */}
      {/* ====================================================== */}

      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:hidden">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Zap
              size={16}
              fill="currentColor"
            />
          </div>

          <span className="text-sm font-black">
            SKILL
            <span className="text-[var(--primary)]">
              ARENA
            </span>
          </span>

        </div>

        <ThemeToggle />

      </div>

      {/* ====================================================== */}
      {/* MAIN */}
      {/* ====================================================== */}

      <main className="lg:ml-[245px]">

        {/* ==================================================== */}
        {/* TOP HUD */}
        {/* ==================================================== */}

        <header className="hidden h-[76px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-10 backdrop-blur-md lg:flex">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
              Player Hub
            </p>

            <p className="mt-1 text-sm font-bold">
              Welcome back, {firstName}
            </p>

          </div>

          <div className="flex items-center gap-7">

            {/* STREAK */}

            <div className="flex items-center gap-2">

              <Flame
                size={18}
                className="text-[var(--orange)]"
                fill="currentColor"
              />

              <div>

                <p className="text-xs font-black">
                  7
                </p>

                <p className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
                  Streak
                </p>

              </div>

            </div>

            {/* XP */}

            <div className="flex items-center gap-2">

              <Zap
                size={17}
                className="text-[var(--cyan)]"
                fill="currentColor"
              />

              <div>

                <p className="text-xs font-black">
                  {xp.toLocaleString()}
                </p>

                <p className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
                  XP
                </p>

              </div>

            </div>

            {/* RANK */}

            <div className="flex items-center gap-2">

              <Trophy
                size={17}
                className="text-[var(--gold)]"
              />

              <div>

                <p className="text-xs font-black">
                  —
                </p>

                <p className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
                  Rank
                </p>

              </div>

            </div>

            <div className="h-7 w-px bg-[var(--border)]" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

          </div>

        </header>

        {/* ==================================================== */}
        {/* PAGE */}
        {/* ==================================================== */}

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">

          {/* ================================================== */}
          {/* HERO */}
          {/* ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="mb-8"
          >

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

              <div>

                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--primary)]">
                  Player Hub
                </p>

                <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Ready for battle?
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
                  Sharpen your skills, defeat challenges
                  and climb the global ranks.
                </p>

              </div>

              {/* LEVEL HUD */}

              <div className="flex items-center gap-4">

                <div className="relative flex h-[92px] w-[92px] items-center justify-center">

                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 100 100"
                  >

                    <circle
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="var(--surface-soft)"
                      strokeWidth="5"
                    />

                    <motion.circle
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="var(--violet)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="270"
                      initial={{
                        strokeDashoffset: 270,
                      }}
                      animate={{
                        strokeDashoffset:
                          270 -
                          (270 * xpProgress) /
                            100,
                      }}
                      transition={{
                        duration: 1.2,
                        ease: "easeOut",
                      }}
                    />

                  </svg>

                  <div className="text-center">

                    <p className="text-2xl font-black">
                      {String(level).padStart(
                        2,
                        "0"
                      )}
                    </p>

                    <p className="text-[7px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Level
                    </p>

                  </div>

                </div>

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Next Level
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {xpIntoLevel}
                    <span className="text-sm font-medium text-[var(--muted)]">
                      {" "}
                      / 1000 XP
                    </span>
                  </p>

                  <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-[var(--surface-soft)]">

                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${xpProgress}%`,
                      }}
                      transition={{
                        duration: 1,
                      }}
                      className="h-full bg-[var(--violet)]"
                    />

                  </div>

                </div>

              </div>

            </div>

          </motion.section>

          {/* ================================================== */}
          {/* DAILY BATTLE */}
          {/* ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
              duration: 0.5,
            }}
            className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
          >

            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1fr_330px]">

              <div className="p-7 sm:p-10">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Swords size={18} />
                  </div>

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                      Battle Arena
                    </p>

                    <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                      Choose your next challenge
                    </p>

                  </div>

                </div>

                <h2 className="mt-8 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                  Ready to test your
                  <span className="text-[var(--primary)]">
                    {" "}skills?
                  </span>
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Enter the arena, complete battles,
                  earn XP and progress through your
                  skill tree.
                </p>

                <button
                  onClick={() =>
                    navigate("/practice")
                  }
                  className="mt-8 flex items-center gap-3 bg-[var(--primary)] px-6 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-blue-500/20"
                >
                  Enter Arena
                  <ArrowUpRight size={16} />
                </button>

              </div>

              <div className="border-t border-[var(--border)] bg-[var(--surface-soft)]/50 p-7 lg:border-l lg:border-t-0">

                <div className="mb-5 flex items-center justify-between">

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Progress Intel
                  </p>

                  <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success)]" />

                </div>

                <div className="space-y-5">

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Active Quests
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {loadingQuests
                        ? "..."
                        : activeQuests.length}
                    </p>

                  </div>

                  <div className="border-t border-[var(--border)] pt-4">

                    <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Skills Tracked
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {loadingSkills
                        ? "..."
                        : skillProgress.length}
                    </p>

                  </div>

                  <div className="border-t border-[var(--border)] pt-4">

                    <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Current Level
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {level}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </motion.section>

          {/* ================================================== */}
          {/* STATS */}
          {/* ================================================== */}

          <section className="mt-5 grid grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4">

            {[
              {
                label: "XP",
                value: xp.toLocaleString(),
                icon: Zap,
                color: "var(--cyan)",
              },
              {
                label: "Level",
                value: level,
                icon: Star,
                color: "var(--violet)",
              },
              {
                label: "Active Quests",
                value: loadingQuests
                  ? "..."
                  : activeQuests.length,
                icon: Target,
                color: "var(--primary)",
              },
              {
                label: "Skills",
                value: loadingSkills
                  ? "..."
                  : skillProgress.length,
                icon: Trophy,
                color: "var(--gold)",
              },
            ].map((stat, index) => {

              const Icon = stat.icon;

              return (
                <motion.div
                  key={stat.label}
                  whileHover={{
                    backgroundColor:
                      "var(--surface-soft)",
                  }}
                  className={`flex items-center gap-3 px-5 py-5 ${
                    index !== 3
                      ? "border-r border-[var(--border)]"
                      : ""
                  }`}
                >

                  <Icon
                    size={18}
                    style={{
                      color: stat.color,
                    }}
                  />

                  <div>

                    <p className="text-sm font-black">
                      {stat.value}
                    </p>

                    <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {stat.label}
                    </p>

                  </div>

                </motion.div>
              );
            })}

          </section>

          {/* ================================================== */}
          {/* SKILL TREE */}
          {/* ================================================== */}

          <section className="mt-12">

            <div className="mb-6 flex items-end justify-between">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                  Progression
                </p>

                <Link
                  to="/skills"
                  className="text-xl font-black transition hover:text-[var(--primary)]"
                >
                  Skill Tree
                </Link>

              </div>

              <button
                onClick={() =>
                  navigate("/skills")
                }
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
              >
                Open Tree
                <ChevronRight size={14} />
              </button>

            </div>

            <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">

              {loadingSkills ? (

                <div className="py-12 text-center text-sm font-bold text-[var(--muted)]">
                  Loading skill progress...
                </div>

              ) : skills.length === 0 ? (

                <div className="py-12 text-center">

                  <LockKeyhole
                    size={30}
                    className="mx-auto text-[var(--muted)]"
                  />

                  <p className="mt-4 text-sm font-black">
                    No skill progress yet
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Complete a battle to start
                    building your skill tree.
                  </p>

                </div>

              ) : (

                <>

                  <div className="absolute left-[15%] right-[15%] top-1/2 hidden h-px bg-gradient-to-r from-[var(--primary)] via-[var(--violet)] to-[var(--cyan)] opacity-30 md:block" />

                  <div className="relative grid grid-cols-2 gap-10 md:grid-cols-4">

                    {skills.map(
                      (skill, index) => (

                        <motion.div
                          key={skill.id}
                          initial={{
                            opacity: 0,
                            scale: 0.8,
                          }}
                          whileInView={{
                            opacity: 1,
                            scale: 1,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            delay:
                              index * 0.1,
                          }}
                          className="relative flex flex-col items-center text-center"
                        >

                          <motion.div
                            whileHover={{
                              scale: 1.08,
                            }}
                            className="relative flex h-20 w-20 items-center justify-center border-2 bg-[var(--surface)]"
                            style={{
                              borderColor:
                                skill.unlocked
                                  ? skill.color
                                  : "var(--border)",
                            }}
                          >

                            <div
                              className="absolute inset-1 opacity-10"
                              style={{
                                background:
                                  skill.color,
                              }}
                            />

                            {skill.unlocked ? (

                              <span
                                className="relative text-lg font-black"
                                style={{
                                  color:
                                    skill.color,
                                }}
                              >
                                {skill.short}
                              </span>

                            ) : (

                              <LockKeyhole
                                size={20}
                                className="relative text-[var(--muted)]"
                              />

                            )}

                          </motion.div>

                          <p className="mt-4 text-sm font-black">
                            {skill.name}
                          </p>

                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">

                            {skill.mastered ? (
                              <span className="text-[var(--success)]">
                                Mastered
                              </span>
                            ) : skill.completed ? (
                              `${skill.progress}% progress`
                            ) : (
                              `${skill.progress}%`
                            )}

                          </p>

                          <div className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-[var(--surface-soft)]">

                            <div
                              className="h-full"
                              style={{
                                width: `${skill.progress}%`,
                                background:
                                  skill.color,
                              }}
                            />

                          </div>

                        </motion.div>

                      )
                    )}

                  </div>

                </>

              )}

            </div>

          </section>

          {/* ================================================== */}
          {/* QUESTS */}
          {/* ================================================== */}

          <section className="mt-12">

            <div className="mb-6 flex items-end justify-between">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                  Daily Progress
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Quests
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Complete challenges to earn bonus XP.
                </p>

              </div>

              <Link
                to="/quests"
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
              >
                View Quests
                <ChevronRight size={14} />
              </Link>

            </div>

            {loadingQuests ? (

              <div className="border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm font-bold text-[var(--muted)]">
                Loading quests...
              </div>

            ) : !featuredQuest ? (

              <div className="border border-[var(--border)] bg-[var(--surface)] p-10 text-center">

                <Target
                  size={30}
                  className="mx-auto text-[var(--muted)]"
                />

                <p className="mt-4 text-sm font-black">
                  No active quests
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  New challenges will appear here.
                </p>

              </div>

            ) : (

              <motion.div
                whileHover={{
                  y: -3,
                }}
                className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-7"
              >

                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

                      {featuredQuest.completed ? (
                        <CheckCircle2 size={21} />
                      ) : (
                        <Target size={21} />
                      )}

                    </div>

                    <div>

                      <p className="text-sm font-black">
                        {featuredQuest.title}
                      </p>

                      <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">
                        {featuredQuest.description ||
                          "Complete this quest to earn bonus XP."}
                      </p>

                      <div className="mt-4 w-full max-w-md">

                        <div className="mb-2 flex items-center justify-between">

                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                            Progress
                          </span>

                          <span className="text-[10px] font-black">
                            {featuredQuest.progress}
                            {" / "}
                            {featuredQuest.target_value}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden bg-[var(--surface-soft)]">

                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${questProgress}%`,
                            }}
                            transition={{
                              duration: 0.8,
                            }}
                            className="h-full bg-[var(--primary)]"
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">

                    <span className="text-xs font-black text-[var(--cyan)]">
                      +{featuredQuest.reward_xp} XP
                    </span>

                    <Link
                      to="/quests"
                      className="flex items-center justify-center gap-2 border border-[var(--border)] px-5 py-3 text-[10px] font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      Open Quests
                      <ArrowUpRight size={15} />
                    </Link>

                  </div>

                </div>

              </motion.div>

            )}

          </section>

          {/* ================================================== */}
          {/* LOWER CONTENT */}
          {/* ================================================== */}

          <section className="mt-12 grid gap-10 xl:grid-cols-[1.3fr_1fr]">

            {/* RECENT BATTLES */}

            <div>

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                    Combat Log
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Recent Battles
                  </h2>

                </div>

                <button
                  onClick={() =>
                    navigate("/practice")
                  }
                  className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
                >
                  Arena
                </button>

              </div>

              <div className="border-y border-[var(--border)]">

                {battles.map(
                  (battle) => (

                    <motion.div
                      key={battle.title}
                      whileHover={{
                        x: 4,
                      }}
                      className="flex items-center gap-4 border-b border-[var(--border)] py-5 last:border-0"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--surface-soft)] text-[var(--primary)]">
                        <Swords size={17} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-black">
                          {battle.title}
                        </p>

                        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                          {battle.category}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-sm font-black text-[var(--success)]">
                          {battle.score}
                        </p>

                        <p className="mt-1 text-[9px] font-black text-[var(--cyan)]">
                          {battle.xp} XP
                        </p>

                      </div>

                    </motion.div>

                  )
                )}

              </div>

            </div>

            {/* LEADERBOARD */}

            <div>

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                    Competition
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Global Rank
                  </h2>

                </div>

                <Trophy
                  size={19}
                  className="text-[var(--gold)]"
                />

              </div>

              <div className="border-y border-[var(--border)]">

                {leaderboard.map(
                  (player) => (

                    <motion.div
                      key={player.rank}
                      whileHover={{
                        x: 4,
                      }}
                      className="flex items-center gap-3 border-b border-[var(--border)] px-2 py-4 last:border-0"
                    >

                      <span className="w-8 text-center text-xs font-black text-[var(--muted)]">
                        {player.rank}
                      </span>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[10px] font-black">
                        {player.name.charAt(0)}
                      </div>

                      <div className="flex-1">

                        <p className="text-xs font-black">
                          {player.name}
                        </p>

                      </div>

                      <p className="text-xs font-black">
                        {player.xp.toLocaleString()}

                        <span className="ml-1 text-[8px] text-[var(--muted)]">
                          XP
                        </span>

                      </p>

                    </motion.div>

                  )
                )}

              </div>

              <button
                onClick={() =>
                  navigate("/practice")
                }
                className="mt-4 flex w-full items-center justify-center gap-2 border border-[var(--border)] py-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Continue Learning
                <ChevronRight size={13} />
              </button>

            </div>

          </section>

          {/* ================================================== */}
          {/* ACHIEVEMENTS */}
          {/* ================================================== */}

          <section className="mt-12 pb-10">

            <div className="mb-5">

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                Collection
              </p>

              <h2 className="mt-1 text-xl font-black">
                Achievements
              </h2>

            </div>

            <div className="grid gap-3 md:grid-cols-3">

              {quests
                .filter(
                  (quest) =>
                    quest.completed
                )
                .slice(0, 3)
                .map((quest) => (

                  <motion.div
                    key={quest.id}
                    whileHover={{
                      y: -3,
                    }}
                    className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--surface-soft)] text-xl">
                      🏆
                    </div>

                    <div>

                      <p className="text-xs font-black">
                        {quest.title}
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                        Quest completed · +
                        {quest.reward_xp} XP
                      </p>

                    </div>

                  </motion.div>

                ))}

              {quests.filter(
                (quest) =>
                  quest.completed
              ).length === 0 && (

                <div className="border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-3">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center bg-[var(--surface-soft)] text-xl">
                      🏆
                    </div>

                    <div>

                      <p className="text-xs font-black">
                        Your achievements will appear here
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                        Complete quests and challenges
                        to build your collection.
                      </p>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}