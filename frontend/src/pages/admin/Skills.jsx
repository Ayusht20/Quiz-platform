import { useEffect, useMemo, useState } from "react";

import {
  Brain,
  BookOpen,
  Layers3,
  Search,
} from "lucide-react";

import {
  getAdminSkills,
} from "../../services/adminManagementService";


export default function Skills() {

  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadSkills();
  }, []);


  const loadSkills = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAdminSkills();

      setSkills(data);

    } catch (err) {

      console.error(
        "Failed to load skills:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Failed to load skills."
      );

    } finally {

      setLoading(false);

    }
  };


  const filteredSkills = useMemo(() => {

    const value =
      search.trim().toLowerCase();

    if (!value) {
      return skills;
    }

    return skills.filter(
      (skill) =>
        skill.name
          ?.toLowerCase()
          .includes(value)
    );

  }, [skills, search]);


  const totalQuestions =
    skills.reduce(
      (sum, skill) =>
        sum + (skill.total_questions || 0),
      0
    );


  const totalTopics =
    skills.reduce(
      (sum, skill) =>
        sum + (skill.topic_count || 0),
      0
    );


  return (
    <div className="min-h-full bg-[var(--bg)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Content Management
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Skills
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Monitor skills, topics and question availability.
          </p>

        </div>


        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <Stat
            icon={Brain}
            label="Skills"
            value={skills.length}
          />

          <Stat
            icon={BookOpen}
            label="Questions"
            value={totalQuestions}
          />

          <Stat
            icon={Layers3}
            label="Topics"
            value={totalTopics}
          />

        </div>


        {/* SEARCH */}

        <div className="mt-8 flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">

          <Search
            size={17}
            className="text-[var(--muted)]"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search skills..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />

        </div>


        {/* CONTENT */}

        {loading ? (

          <div className="mt-8 text-center text-sm text-[var(--muted)]">
            Loading skills...
          </div>

        ) : error ? (

          <div className="mt-8 border border-red-500/30 bg-red-500/10 p-6">

            <p className="text-sm font-bold text-red-400">
              {error}
            </p>

            <button
              onClick={loadSkills}
              className="mt-4 bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
            >
              Retry
            </button>

          </div>

        ) : filteredSkills.length === 0 ? (

          <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
            No skills found.
          </div>

        ) : (

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredSkills.map((skill) => (

              <div
                key={skill.id}
                className="border border-[var(--border)] bg-[var(--surface)] p-6"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Brain size={19} />
                  </div>

                  <span className="text-[9px] font-black uppercase text-[var(--muted)]">
                    {skill.topic_count} Topics
                  </span>

                </div>


                <h2 className="mt-5 text-lg font-black">
                  {skill.name}
                </h2>


                <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                  {skill.description ||
                    "No description provided."}
                </p>


                {/* QUESTION COUNTS */}

                <div className="mt-6 grid grid-cols-2 gap-2">

                  <Difficulty
                    label="Easy"
                    value={
                      skill.easy_questions
                    }
                  />

                  <Difficulty
                    label="Medium"
                    value={
                      skill.medium_questions
                    }
                  />

                  <Difficulty
                    label="Hard"
                    value={
                      skill.hard_questions
                    }
                  />

                  <Difficulty
                    label="Total"
                    value={
                      skill.total_questions
                    }
                  />

                </div>


                {/* TOPICS */}

                <div className="mt-5">

                  <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Available Topics
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {skill.topics?.length ? (

                      skill.topics
                        .slice(0, 8)
                        .map((topic) => (

                          <span
                            key={topic}
                            className="bg-[var(--surface-soft)] px-2.5 py-1 text-[9px] font-bold"
                          >
                            {topic}
                          </span>

                        ))

                    ) : (

                      <span className="text-xs text-[var(--muted)]">
                        No topics available.
                      </span>

                    )}

                    {skill.topics?.length > 8 && (
                      <span className="px-2 py-1 text-[9px] font-black text-[var(--primary)]">
                        +{skill.topics.length - 8} more
                      </span>
                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}


function Stat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

    </div>
  );
}


function Difficulty({
  label,
  value,
}) {
  return (
    <div className="bg-[var(--surface-soft)] p-3">

      <p className="text-[9px] font-black uppercase text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value ?? 0}
      </p>

    </div>
  );
}