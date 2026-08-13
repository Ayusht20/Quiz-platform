import {
  ArrowUpRight,
  Flame,
  Trophy,
  Zap,
  Swords,
  ChevronRight,
  LockKeyhole,
  Target,
  Star,
} from "lucide-react";

import { motion } from "framer-motion";

import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

const skills = [
  {
    name: "JavaScript",
    short: "JS",
    progress: 82,
    color: "var(--primary)",
    unlocked: true,
  },
  {
    name: "React",
    short: "RE",
    progress: 64,
    color: "var(--violet)",
    unlocked: true,
  },
  {
    name: "Python",
    short: "PY",
    progress: 48,
    color: "var(--cyan)",
    unlocked: true,
  },
  {
    name: "Node.js",
    short: "ND",
    progress: 22,
    color: "var(--orange)",
    unlocked: false,
  },
];

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
  {
    rank: 126,
    name: "Ayush",
    xp: 4210,
    current: true,
  },
];

const achievements = [
  {
    icon: "⚡",
    title: "First Blood",
    text: "Complete your first battle",
    unlocked: true,
  },
  {
    icon: "🔥",
    title: "On Fire",
    text: "Maintain a 7 day streak",
    unlocked: false,
  },
  {
    icon: "◆",
    title: "Code Master",
    text: "Reach 5,000 XP",
    unlocked: false,
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;

  const xpIntoLevel = xp % 1000;
  const xpProgress = Math.min(
    (xpIntoLevel / 1000) * 100,
    100
  );

  const firstName =
    user?.name?.split(" ")[0] || "Player";

  return (
    <div className="arena-background min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Sidebar />

      {/* MOBILE HEADER */}

      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:hidden">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Zap size={16} fill="currentColor" />
          </div>

          <span className="text-sm font-black">
            SKILL<span className="text-[var(--primary)]">
              ARENA
            </span>
          </span>

        </div>

        <ThemeToggle />

      </div>

      <main className="lg:ml-[245px]">

        {/* TOP HUD */}

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
                  #126
                </p>

                <p className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
                  Rank
                </p>

              </div>

            </div>

            <div className="h-7 w-px bg-[var(--border)]" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

          </div>

        </header>

        {/* PAGE */}

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">

          {/* HERO */}

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
                  Sharpen your skills, defeat challenges and
                  climb the global ranks.
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
                          270 - (270 * xpProgress) / 100,
                      }}
                      transition={{
                        duration: 1.2,
                        ease: "easeOut",
                      }}
                    />

                  </svg>

                  <div className="text-center">

                    <p className="text-2xl font-black">
                      {String(level).padStart(2, "0")}
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
                    {xpIntoLevel}{" "}
                    <span className="text-sm font-medium text-[var(--muted)]">
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

          {/* DAILY BATTLE */}

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

            {/* animated scan line */}

            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute left-0 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"
            />

            {/* decorative glow */}

            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1fr_330px]">

              <div className="p-7 sm:p-10">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Swords size={18} />
                  </div>

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                      Daily Battle
                    </p>

                    <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                      Recommended challenge
                    </p>

                  </div>

                </div>

                <h2 className="mt-8 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                  JavaScript
                  <span className="text-[var(--primary)]">
                    {" "}Array Mastery
                  </span>
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Put your JavaScript fundamentals to the
                  test. Master arrays, methods and practical
                  problem solving.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">

                  <span className="text-xs font-semibold text-[var(--muted)]">
                    <strong className="text-[var(--text)]">
                      10
                    </strong>{" "}
                    Questions
                  </span>

                  <span className="text-xs font-semibold text-[var(--muted)]">
                    <strong className="text-[var(--text)]">
                      08
                    </strong>{" "}
                    Minutes
                  </span>

                  <span className="text-xs font-black text-[var(--cyan)]">
                    +150 XP
                  </span>

                  <span className="text-xs font-black text-[var(--violet)]">
                    Level 03
                  </span>

                </div>

                <motion.button
                  whileHover={{
                    scale: 1.025,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  className="mt-8 flex items-center gap-3 bg-[var(--primary)] px-6 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-blue-500/20"
                >

                  Enter Arena

                  <ArrowUpRight size={16} />

                </motion.button>

              </div>

              {/* BATTLE PREVIEW */}

              <div className="border-t border-[var(--border)] bg-[var(--surface-soft)]/50 p-7 lg:border-l lg:border-t-0">

                <div className="mb-5 flex items-center justify-between">

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Battle Intel
                  </p>

                  <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success)]" />

                </div>

                <div className="space-y-4">

                  <div>

                    <div className="mb-2 flex justify-between text-[10px]">

                      <span className="text-[var(--muted)]">
                        Difficulty
                      </span>

                      <span className="font-bold text-[var(--orange)]">
                        Intermediate
                      </span>

                    </div>

                    <div className="flex gap-1">

                      {[1, 2, 3, 4, 5].map((item) => (
                        <div
                          key={item}
                          className={`h-1.5 flex-1 ${
                            item <= 3
                              ? "bg-[var(--orange)]"
                              : "bg-[var(--border)]"
                          }`}
                        />
                      ))}

                    </div>

                  </div>

                  <div className="border-t border-[var(--border)] pt-4">

                    <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Your previous best
                    </p>

                    <div className="mt-2 flex items-end justify-between">

                      <p className="text-2xl font-black">
                        86%
                      </p>

                      <p className="text-xs font-bold text-[var(--success)]">
                        +12% improvement
                      </p>

                    </div>

                  </div>

                  <div className="border-t border-[var(--border)] pt-4">

                    <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Players completed
                    </p>

                    <p className="mt-2 text-lg font-black">
                      12,482
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </motion.section>

          {/* STATS STRIP */}

          <section className="mt-5 grid grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4">

            {[
              {
                label: "Battles",
                value: "24",
                icon: Swords,
                color: "var(--primary)",
              },
              {
                label: "Avg. Score",
                value: "78%",
                icon: Target,
                color: "var(--cyan)",
              },
              {
                label: "Streak",
                value: "7 Days",
                icon: Flame,
                color: "var(--orange)",
              },
              {
                label: "Global Rank",
                value: "#126",
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

          {/* SKILL TREE */}

          <section className="mt-12">

            <div className="mb-6 flex items-end justify-between">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                  Progression
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Skill Tree
                </h2>

              </div>

              <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">
                Open Tree
                <ChevronRight size={14} />
              </button>

            </div>

            <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">

              {/* TREE CONNECTION */}

              <div className="absolute left-[15%] right-[15%] top-1/2 hidden h-px bg-gradient-to-r from-[var(--primary)] via-[var(--violet)] to-[var(--cyan)] opacity-30 md:block" />

              <div className="relative grid grid-cols-2 gap-10 md:grid-cols-4">

                {skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
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
                      delay: index * 0.1,
                    }}
                    className="relative flex flex-col items-center text-center"
                  >

                    <motion.div
                      whileHover={{
                        scale: 1.08,
                      }}
                      className="relative flex h-20 w-20 items-center justify-center border-2 bg-[var(--surface)]"
                      style={{
                        borderColor: skill.unlocked
                          ? skill.color
                          : "var(--border)",
                      }}
                    >

                      <div
                        className="absolute inset-1 opacity-10"
                        style={{
                          background: skill.color,
                        }}
                      />

                      {skill.unlocked ? (
                        <span
                          className="relative text-lg font-black"
                          style={{
                            color: skill.color,
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
                      {skill.unlocked
                        ? `${skill.progress}% mastered`
                        : "Locked"}
                    </p>

                  </motion.div>
                ))}

              </div>

            </div>

          </section>

          {/* LOWER CONTENT */}

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

                <button className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">
                  History
                </button>

              </div>

              <div className="border-y border-[var(--border)]">

                {battles.map((battle, index) => (
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
                ))}

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

                {leaderboard.map((player) => (
                  <motion.div
                    key={player.rank}
                    whileHover={{
                      x: 4,
                    }}
                    className={`flex items-center gap-3 border-b border-[var(--border)] px-2 py-4 last:border-0 ${
                      player.current
                        ? "bg-[var(--primary-soft)]"
                        : ""
                    }`}
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

                        {player.current && (
                          <span className="ml-2 text-[8px] uppercase tracking-wider text-[var(--primary)]">
                            You
                          </span>
                        )}

                      </p>

                    </div>

                    <p className="text-xs font-black">
                      {player.xp.toLocaleString()}
                      <span className="ml-1 text-[8px] text-[var(--muted)]">
                        XP
                      </span>
                    </p>

                  </motion.div>
                ))}

              </div>

              <button className="mt-4 flex w-full items-center justify-center gap-2 border border-[var(--border)] py-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
                View Full Leaderboard
                <ChevronRight size={13} />
              </button>

            </div>

          </section>

          {/* ACHIEVEMENTS */}

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

              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  whileHover={{
                    y: -3,
                  }}
                  className={`flex items-center gap-4 border p-5 ${
                    achievement.unlocked
                      ? "border-[var(--border)] bg-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface-soft)] opacity-60"
                  }`}
                >

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--surface-soft)] text-xl">
                    {achievement.unlocked
                      ? achievement.icon
                      : "🔒"}
                  </div>

                  <div>

                    <p className="text-xs font-black">
                      {achievement.title}
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                      {achievement.text}
                    </p>

                  </div>

                </motion.div>
              ))}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}