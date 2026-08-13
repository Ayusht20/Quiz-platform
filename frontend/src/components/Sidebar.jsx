import {
  Home,
  Swords,
  Target,
  Network,
  Trophy,
  Medal,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  {
    name: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    name: "Battle",
    path: "/practice",
    icon: Swords,
  },
  {
    name: "Quests",
    path: "/quests",
    icon: Target,
  },
  {
    name: "Skill Tree",
    path: "/skills",
    icon: Network,
  },
  {
    name: "Leaderboard",
    path: "/leaderboard",
    icon: Trophy,
  },
  {
    name: "Achievements",
    path: "/badges",
    icon: Medal,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[245px] flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">

      {/* LOGO */}

      <div className="px-7 pb-7 pt-8">

        <div className="flex items-center gap-2">

          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20">

            <Zap
              size={19}
              fill="currentColor"
            />

          </div>

          <div>

            <h1 className="text-[17px] font-black tracking-tight">
              SKILL<span className="text-[var(--primary)]">ARENA</span>
            </h1>

            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
              Enter. Learn. Conquer.
            </p>

          </div>

        </div>

      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 px-3">

        <p className="mb-3 px-4 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
          Arena
        </p>

        <div className="space-y-1">

          {navigation.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.name}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.04,
                }}
              >

                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-all ${
                      isActive
                        ? "text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`
                  }
                >

                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-[var(--primary)]"
                        />
                      )}

                      <Icon
                        size={18}
                        className={
                          isActive
                            ? "text-[var(--primary)]"
                            : ""
                        }
                      />

                      <span>{item.name}</span>

                      {item.name === "Battle" && (
                        <span className="ml-auto rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-[8px] font-black uppercase text-[var(--primary)]">
                          Play
                        </span>
                      )}
                    </>
                  )}

                </NavLink>

              </motion.div>
            );
          })}

        </div>

      </nav>

      {/* PLAYER PANEL */}

      <div className="border-t border-[var(--border)] p-4">

        <div className="mb-4 flex items-center justify-between">

          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
            Theme
          </span>

          <ThemeToggle />

        </div>

        <div className="mb-4 flex items-center gap-3">

          <div className="relative">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-black text-[var(--primary)]">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" />

          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-xs font-bold">
              {user?.name || "Player"}
            </p>

            <div className="mt-1 flex items-center gap-1.5">

              <span className="text-[9px] font-black uppercase text-[var(--violet)]">
                LVL {user?.level ?? 1}
              </span>

              <span className="text-[9px] text-[var(--muted)]">
                •
              </span>

              <span className="text-[9px] text-[var(--muted)]">
                {user?.xp ?? 0} XP
              </span>

            </div>

          </div>

        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--danger)]"
        >
          <LogOut size={16} />
          Logout
        </button>

      </div>

    </aside>
  );
}