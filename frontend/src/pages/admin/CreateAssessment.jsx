import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import {
  createAssessment,
  getAssessmentTopics,
  getAvailableQuestionCount,
  getSkills,
} from "../../services/adminAssessmentService";


export default function CreateAssessment() {

  const navigate = useNavigate();


  // ============================================================
  // DATA
  // ============================================================

  const [skills, setSkills] =
    useState([]);

  const [topics, setTopics] =
    useState([]);


  // ============================================================
  // FORM
  // ============================================================

  const [form, setForm] = useState({
    title: "",
    description: "",
    assessment_type: "BATTLE",
    skill_id: "",
    topic: "",
    difficulty: "EASY",
    question_count: 10,
    duration_minutes: 10,
    passing_percentage: 60,
    max_attempts: "",
  });


  // ============================================================
  // STATES
  // ============================================================

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [loadingTopics, setLoadingTopics] =
    useState(false);

  const [checkingQuestions, setCheckingQuestions] =
    useState(false);

  const [availableQuestions, setAvailableQuestions] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ============================================================
  // LOAD SKILLS
  // ============================================================

  useEffect(() => {

    const loadSkills = async () => {

      try {

        setLoadingSkills(true);

        const data =
          await getSkills();

        setSkills(data || []);

      } catch (error) {

        console.error(error);

        setError(
          error.response?.data?.detail ||
          "Unable to load skills."
        );

      } finally {

        setLoadingSkills(false);

      }

    };

    loadSkills();

  }, []);


  // ============================================================
  // LOAD TOPICS WHEN SKILL CHANGES
  // ============================================================

  useEffect(() => {

    if (!form.skill_id) {

      setTopics([]);

      setForm((previous) => ({
        ...previous,
        topic: "",
      }));

      return;
    }


    const loadTopics = async () => {

      try {

        setLoadingTopics(true);

        const data =
          await getAssessmentTopics(
            form.skill_id
          );

        setTopics(data || []);

      } catch (error) {

        console.error(error);

        setError(
          error.response?.data?.detail ||
          "Unable to load topics."
        );

      } finally {

        setLoadingTopics(false);

      }

    };

    loadTopics();

  }, [
    form.skill_id,
  ]);


  // ============================================================
  // CHECK AVAILABLE QUESTIONS
  // ============================================================

  useEffect(() => {

    if (!form.skill_id) {

      setAvailableQuestions(null);

      return;
    }


    const checkQuestions = async () => {

      try {

        setCheckingQuestions(true);

        const data =
          await getAvailableQuestionCount({
            skillId: form.skill_id,
            topic: form.topic,
            difficulty: form.difficulty,
          });

        setAvailableQuestions(
          data.available_questions
        );

      } catch (error) {

        console.error(error);

        setAvailableQuestions(null);

      } finally {

        setCheckingQuestions(false);

      }

    };

    checkQuestions();

  }, [
    form.skill_id,
    form.topic,
    form.difficulty,
  ]);


  // ============================================================
  // CHANGE FIELD
  // ============================================================

  const updateField = (
    field,
    value
  ) => {

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");

  };


  // ============================================================
  // CREATE
  // ============================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!form.title.trim()) {

      setError(
        "Battle title is required."
      );

      return;
    }


    if (!form.skill_id) {

      setError(
        "Select a skill."
      );

      return;
    }


    if (
      Number(form.question_count) <= 0
    ) {

      setError(
        "Question count must be greater than 0."
      );

      return;
    }


    if (
      availableQuestions !== null &&
      Number(form.question_count)
      > availableQuestions
    ) {

      setError(
        `Only ${availableQuestions} matching questions are available.`
      );

      return;
    }


    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    try {

      setSaving(true);

      const assessment =
        await createAssessment({

          title:
            form.title.trim(),

          description:
            form.description.trim()
            || null,

          assessment_type:
            form.assessment_type,

          skill_id:
            Number(form.skill_id),

          topic:
            form.topic.trim()
            || null,

          difficulty:
            form.difficulty,

          question_count:
            Number(form.question_count),

          duration_minutes:
            Number(form.duration_minutes),

          passing_percentage:
            Number(form.passing_percentage),

          max_attempts:
            form.max_attempts
              ? Number(form.max_attempts)
              : null,

        });


      setSuccess(
        "Battle created successfully."
      );


      setTimeout(() => {

        navigate(
          `/admin/assessments/${assessment.id}`
        );

      }, 700);

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.detail ||
        "Unable to create battle."
      );

    } finally {

      setSaving(false);

    }

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">


        {/* HEADER */}

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate(
                "/admin/assessments"
              )
            }
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >

            <ArrowLeft size={16} />

            Back to Battles

          </button>


          <div className="flex items-center gap-2">

            <Swords
              size={18}
              className="text-[var(--primary)]"
            />

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              Battle Builder
            </span>

          </div>

        </div>


        {/* TITLE */}

        <section className="mt-12">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Automatic Battle
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Create Battle
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Configure the skill, topic, difficulty and
            question count. SkillArena will automatically
            build the battle from your question bank when
            you publish it.
          </p>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-8 border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">

            {error}

          </div>

        )}


        {/* SUCCESS */}

        {success && (

          <div className="mt-8 flex items-center gap-2 border border-[var(--success)]/30 bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">

            <CheckCircle2
              size={17}
            />

            {success}

          </div>

        )}


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >


          {/* BASIC INFORMATION */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

                <Swords size={19} />

              </div>

              <div>

                <h2 className="font-black">
                  Battle Information
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Define the identity of the battle.
                </p>

              </div>

            </div>


            <div className="mt-7 space-y-5">


              {/* TITLE */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Battle Title
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Python Arrays Challenge"
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Test your knowledge of Python arrays."
                  className="mt-2 w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                />

              </div>


              {/* TYPE */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Battle Type
                  </label>

                  <select
                    value={
                      form.assessment_type
                    }
                    onChange={(event) =>
                      updateField(
                        "assessment_type",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none"
                  >

                    <option value="BATTLE">
                      Battle
                    </option>

                    <option value="ASSESSMENT">
                      Assessment
                    </option>

                    <option value="CHALLENGE">
                      Challenge
                    </option>

                  </select>

                </div>


                <div>

                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Maximum Attempts
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.max_attempts
                    }
                    onChange={(event) =>
                      updateField(
                        "max_attempts",
                        event.target.value
                      )
                    }
                    placeholder="Unlimited"
                    className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none"
                  />

                </div>

              </div>

            </div>

          </motion.section>


          {/* AUTOMATIC CONFIGURATION */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
            className="border border-[var(--primary)]/30 bg-[var(--surface)] p-6 lg:p-8"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary)] text-white">

                <Target size={19} />

              </div>

              <div>

                <h2 className="font-black">
                  Automatic Question Selection
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  These settings determine which questions
                  will enter the battle.
                </p>

              </div>

            </div>


            <div className="mt-7 grid gap-5 md:grid-cols-2">


              {/* SKILL */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Skill
                </label>

                <select
                  value={form.skill_id}
                  disabled={loadingSkills}
                  onChange={(event) => {

                    updateField(
                      "skill_id",
                      event.target.value
                    );

                    updateField(
                      "topic",
                      ""
                    );

                  }}
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none disabled:opacity-60"
                >

                  <option value="">
                    Select Skill
                  </option>

                  {skills.map(
                    (skill) => (

                      <option
                        key={skill.id}
                        value={skill.id}
                      >
                        {skill.name}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* TOPIC */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Topic
                </label>

                <select
                  value={form.topic}
                  disabled={
                    !form.skill_id ||
                    loadingTopics
                  }
                  onChange={(event) =>
                    updateField(
                      "topic",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none disabled:opacity-60"
                >

                  <option value="">
                    All Topics
                  </option>

                  {topics.map(
                    (topic) => (

                      <option
                        key={topic}
                        value={topic}
                      >
                        {topic}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* DIFFICULTY */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Difficulty
                </label>

                <select
                  value={
                    form.difficulty
                  }
                  onChange={(event) =>
                    updateField(
                      "difficulty",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none"
                >

                  <option value="BEGINNER">
                    Beginner
                  </option>

                  <option value="EASY">
                    Easy
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HARD">
                    Hard
                  </option>

                  <option value="MIXED">
                    Mixed
                  </option>

                </select>

              </div>


              {/* QUESTION COUNT */}

              <div>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                  Question Count
                </label>

                <div className="relative">

                  <Layers3
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={
                      form.question_count
                    }
                    onChange={(event) =>
                      updateField(
                        "question_count",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-10 pr-4 text-sm outline-none"
                  />

                </div>

              </div>

            </div>


            {/* AVAILABILITY */}

            <div className="mt-6">

              {checkingQuestions ? (

                <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-xs text-[var(--muted)]">

                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  Checking question bank...

                </div>

              ) : availableQuestions !== null ? (

                <div
                  className={`flex items-center justify-between border p-4 ${
                    availableQuestions >=
                    Number(form.question_count)
                      ? "border-[var(--success)]/30 bg-[var(--success)]/10"
                      : "border-[var(--danger)]/30 bg-[var(--danger)]/10"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <CheckCircle2
                      size={18}
                    />

                    <div>

                      <p className="text-xs font-black">
                        {availableQuestions} matching questions available
                      </p>

                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        Required:{" "}
                        {form.question_count}
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-lg font-black">
                      {availableQuestions}
                    </p>

                    <p className="text-[9px] uppercase text-[var(--muted)]">
                      Available
                    </p>

                  </div>

                </div>

              ) : (

                <div className="border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-xs text-[var(--muted)]">

                  Select a skill to check question
                  availability.

                </div>

              )}

            </div>

          </motion.section>


          {/* BATTLE RULES */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className="border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

                <Trophy size={19} />

              </div>

              <div>

                <h2 className="font-black">
                  Battle Rules
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Configure how the student will play.
                </p>

              </div>

            </div>


            <div className="mt-7 grid gap-5 md:grid-cols-2">


              {/* DURATION */}

              <div>

                <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">

                  <Clock3 size={13} />

                  Duration

                </label>

                <input
                  type="number"
                  min="1"
                  max="300"
                  value={
                    form.duration_minutes
                  }
                  onChange={(event) =>
                    updateField(
                      "duration_minutes",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none"
                />

              </div>


              {/* PASSING */}

              <div>

                <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">

                  <Trophy size={13} />

                  Passing Percentage

                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    form.passing_percentage
                  }
                  onChange={(event) =>
                    updateField(
                      "passing_percentage",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none"
                />

              </div>

            </div>

          </motion.section>


          {/* SUMMARY */}

          <div className="border border-[var(--primary)]/20 bg-[var(--primary-soft)] p-5">

            <div className="flex items-start gap-3">

              <Swords
                size={18}
                className="mt-0.5 text-[var(--primary)]"
              />

              <div>

                <p className="text-xs font-black">
                  How this battle will work
                </p>

                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">

                  When you publish this battle,
                  SkillArena will randomly select{" "}

                  <strong>
                    {form.question_count}
                  </strong>{" "}

                  active questions matching{" "}

                  <strong>
                    {form.topic || "all topics"}
                  </strong>{" "}

                  from the selected skill at the chosen
                  difficulty.

                </p>

              </div>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="flex justify-end">

            <button
              type="submit"
              disabled={
                saving ||
                !form.skill_id ||
                (
                  availableQuestions !== null &&
                  Number(form.question_count)
                  > availableQuestions
                )
              }
              className="flex items-center gap-2 bg-[var(--primary)] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (

                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Creating...

                </>

              ) : (

                <>
                  Create Battle

                  <ArrowRight
                    size={16}
                  />

                </>

              )}

            </button>

          </div>

        </form>

      </main>

    </div>
  );
}