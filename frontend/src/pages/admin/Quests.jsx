import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Search,
  Target,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  getAllQuests,
  deleteQuest,
} from "../../services/adminQuestService";

export default function Quests() {

  const [quests, setQuests] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const loadQuests = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAllQuests();

      setQuests(data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load quests."
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const filteredQuests =
    useMemo(() => {

      return quests.filter(
        (quest) =>
          quest.title
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [quests, search]);

  const handleDelete = async (
    questId
  ) => {

    const confirmed =
      window.confirm(
        "Deactivate this quest?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteQuest(
        questId
      );

      await loadQuests();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to deactivate quest."
      );
    }
  };


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
              Quests
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create and manage challenges that
              reward students with XP.
            </p>

          </div>

          <button
            onClick={() =>
              window.location.href =
                "/admin/quests/create"
            }
            className="flex items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
          >
            <Plus size={16} />
            Create Quest
          </button>

        </div>


        {/* ERROR */}

        {error && (

          <div className="mt-6 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>

        )}


        {/* SEARCH */}

        <div className="mt-8 flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">

          <Search
            size={17}
            className="text-[var(--muted)]"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search quests..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="mt-10 text-center text-sm text-[var(--muted)]">
            Loading quests...
          </div>

        ) : filteredQuests.length === 0 ? (

          <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <Target
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <h2 className="mt-4 font-black">
              No quests found
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create your first quest.
            </p>

          </div>

        ) : (

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredQuests.map(
              (quest, index) => (

                <motion.article
                  key={quest.id}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.05,
                  }}
                  className="border border-[var(--border)] bg-[var(--surface)] p-6"
                >

                  {/* TOP */}

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Target size={19} />
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[9px] font-black uppercase ${
                        quest.is_active
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-[var(--surface-soft)] text-[var(--muted)]"
                      }`}
                    >
                      {quest.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>


                  {/* TITLE */}

                  <h2 className="mt-5 text-lg font-black">
                    {quest.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {quest.description ||
                      "No description provided."}
                  </p>


                  {/* TYPE */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">
                      {quest.quest_type}
                    </span>

                    <span className="border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      {quest.target_type}
                    </span>

                  </div>


                  {/* STATS */}

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="bg-[var(--surface-soft)] p-3">

                      <div className="flex items-center gap-2 text-[var(--muted)]">

                        <Target size={13} />

                        <span className="text-[9px] font-bold uppercase">
                          Target
                        </span>

                      </div>

                      <p className="mt-1 text-sm font-black">
                        {quest.target_value}
                      </p>

                    </div>


                    <div className="bg-[var(--surface-soft)] p-3">

                      <div className="flex items-center gap-2 text-[var(--cyan)]">

                        <Zap size={13} />

                        <span className="text-[9px] font-bold uppercase">
                          Reward
                        </span>

                      </div>

                      <p className="mt-1 text-sm font-black">
                        +{quest.reward_xp} XP
                      </p>

                    </div>

                  </div>


                  {/* DATES */}

                  {(quest.starts_at ||
                    quest.ends_at) && (

                    <div className="mt-4 flex items-center gap-2 text-[10px] text-[var(--muted)]">

                      <Clock3
                        size={12}
                      />

                      <span>
                        {quest.starts_at
                          ? new Date(
                              quest.starts_at
                            ).toLocaleDateString()
                          : "Now"}

                        {" → "}

                        {quest.ends_at
                          ? new Date(
                              quest.ends_at
                            ).toLocaleDateString()
                          : "No expiry"}
                      </span>

                    </div>

                  )}


                  {/* ACTIONS */}

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <button
                      onClick={() =>
                        window.location.href =
                          `/admin/quests/${quest.id}/edit`
                      }
                      className="flex items-center justify-center gap-2 border border-[var(--border)] px-3 py-3 text-[10px] font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>


                    {quest.is_active && (

                      <button
                        onClick={() =>
                          handleDelete(
                            quest.id
                          )
                        }
                        className="flex items-center justify-center gap-2 border border-red-500/20 px-3 py-3 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2
                          size={13}
                        />
                        Disable
                      </button>

                    )}

                  </div>

                </motion.article>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
}