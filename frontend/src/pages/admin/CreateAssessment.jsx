import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  Layers3,
  Loader2,
  Search,
  Swords,
  Trophy,
  X,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";

import {
  createAssessment,
  getQuestions,
  getSkills,
  addQuestionToAssessment,
} from "../../services/adminAssessmentService";


export default function CreateAssessment() {

  const navigate = useNavigate();


  // ============================================================
  // STEP
  // ============================================================

  const [step, setStep] = useState(1);


  // ============================================================
  // ASSESSMENT DETAILS
  // ============================================================

  const [form, setForm] = useState({
    title: "",
    description: "",
    assessment_type: "PRACTICE",
    difficulty: "BEGINNER",
    duration_minutes: 30,
    passing_percentage: 60,
    max_attempts: "",
  });


  // ============================================================
  // QUESTION BANK
  // ============================================================

  const [questions, setQuestions] = useState([]);

  const [skills, setSkills] = useState([]);

  const [selectedQuestions, setSelectedQuestions] =
    useState([]);


  // ============================================================
  // QUESTION FILTERS
  // ============================================================

  const [search, setSearch] = useState("");

  const [skillFilter, setSkillFilter] =
    useState("");

  const [difficultyFilter, setDifficultyFilter] =
    useState("");


  // ============================================================
  // LOADING
  // ============================================================

  const [loadingQuestions, setLoadingQuestions] =
    useState(false);

  const [loadingSkills, setLoadingSkills] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  // ============================================================
  // ERROR
  // ============================================================

  const [error, setError] =
    useState("");


  // ============================================================
  // SUCCESS
  // ============================================================

  const [success, setSuccess] =
    useState("");


  // ============================================================
  // LOAD SKILLS
  // ============================================================

  useEffect(() => {

    const loadSkills = async () => {

      try {

        setLoadingSkills(true);

        const data = await getSkills();

        setSkills(data || []);

      } catch (error) {

        console.error(
          "Failed to load skills:",
          error
        );

      } finally {

        setLoadingSkills(false);

      }

    };

    loadSkills();

  }, []);


  // ============================================================
  // LOAD QUESTIONS
  // ============================================================

  useEffect(() => {

    if (step !== 2) {
      return;
    }

    const loadQuestions = async () => {

      try {

        setLoadingQuestions(true);

        setError("");

        const data = await getQuestions({
          skillId: skillFilter,
          difficulty: difficultyFilter,
        });

        setQuestions(data || []);

      } catch (error) {

        console.error(
          "Failed to load question bank:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Failed to load question bank."
        );

      } finally {

        setLoadingQuestions(false);

      }

    };

    loadQuestions();

  }, [
    step,
    skillFilter,
    difficultyFilter,
  ]);


  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ============================================================
  // SEARCH FILTER
  // ============================================================

  const filteredQuestions = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return questions;
    }

    return questions.filter(
      (question) =>
        question.question_text
          ?.toLowerCase()
          .includes(query) ||

        question.topic
          ?.toLowerCase()
          .includes(query)
    );

  }, [
    questions,
    search,
  ]);


  // ============================================================
  // SELECT / DESELECT
  // ============================================================

  const toggleQuestion = (question) => {

    setSelectedQuestions(
      (previous) => {

        const exists = previous.some(
          (item) =>
            item.id === question.id
        );

        if (exists) {

          return previous.filter(
            (item) =>
              item.id !== question.id
          );

        }

        return [
          ...previous,
          question,
        ];

      }
    );

  };


  // ============================================================
  // REMOVE SELECTED
  // ============================================================

  const removeSelectedQuestion = (
    questionId
  ) => {

    setSelectedQuestions(
      (previous) =>
        previous.filter(
          (question) =>
            question.id !== questionId
        )
    );

  };


  // ============================================================
  // IS SELECTED
  // ============================================================

  const isSelected = (questionId) => {

    return selectedQuestions.some(
      (question) =>
        question.id === questionId
    );

  };


  // ============================================================
  // STEP 1 VALIDATION
  // ============================================================

  const validateDetails = () => {

    if (
      !form.title.trim()
    ) {

      setError(
        "Battle title is required."
      );

      return false;

    }

    if (
      form.title.trim().length < 3
    ) {

      setError(
        "Battle title must contain at least 3 characters."
      );

      return false;

    }

    if (
      Number(form.duration_minutes) < 1
    ) {

      setError(
        "Duration must be at least 1 minute."
      );

      return false;

    }

    setError("");

    return true;

  };


  // ============================================================
  // NEXT STEP
  // ============================================================

  const nextStep = () => {

    setError("");

    if (step === 1) {

      if (!validateDetails()) {
        return;
      }

      setStep(2);

      return;

    }

    if (step === 2) {

      if (
        selectedQuestions.length === 0
      ) {

        setError(
          "Select at least one question for the battle."
        );

        return;

      }

      setStep(3);

      return;

    }

  };


  // ============================================================
  // PREVIOUS STEP
  // ============================================================

  const previousStep = () => {

    setError("");

    if (step > 1) {
      setStep(step - 1);
    }

  };


  // ============================================================
  // CREATE BATTLE
  // ============================================================

  const handleCreateBattle = async () => {

    try {

      setSaving(true);

      setError("");

      setSuccess("");


      // ========================================================
      // 1. CREATE ASSESSMENT
      // ========================================================

      const assessment =
        await createAssessment({

          title:
            form.title.trim(),

          description:
            form.description.trim() ||
            null,

          assessment_type:
            form.assessment_type,

          difficulty:
            form.difficulty,

          duration_minutes:
            Number(
              form.duration_minutes
            ),

          passing_percentage:
            Number(
              form.passing_percentage
            ),

          max_attempts:
            form.max_attempts === ""
              ? null
              : Number(
                  form.max_attempts
                ),

        });


      // ========================================================
      // 2. ATTACH QUESTIONS
      // ========================================================

      for (
        let index = 0;
        index < selectedQuestions.length;
        index++
      ) {

        const question =
          selectedQuestions[index];

        await addQuestionToAssessment(
          assessment.id,
          {
            question_id:
              question.id,

            question_order:
              index + 1,
          }
        );

      }


      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccess(
        "Battle created successfully."
      );


      setTimeout(() => {

        navigate(
          `/admin/assessments/${assessment.id}`
        );

      }, 800);


    } catch (error) {

      console.error(
        "Failed to create battle:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Failed to create battle."
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

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate(
                "/admin/assessments"
              )
            }
            className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--text)]"
          >

            <ArrowLeft size={17} />

            Assessments

          </button>


          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

              <Swords size={20} />

            </div>

            <div>

              <p className="text-sm font-black tracking-[0.15em]">
                SKILLARENA
              </p>

              <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--muted)]">
                ADMIN CONTROL
              </p>

            </div>

          </div>

        </div>


        {/* ================================================== */}
        {/* TITLE */}
        {/* ================================================== */}

        <div className="mt-14">

          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--primary)]">
            Battle Builder
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight lg:text-5xl">
            Create a new battle
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Build a challenge, select questions from
            your question bank, review everything and
            prepare it for students.
          </p>

        </div>


        {/* ================================================== */}
        {/* STEPS */}
        {/* ================================================== */}

        <div className="mt-10 grid gap-3 md:grid-cols-3">

          {[
            {
              number: 1,
              title: "Details",
            },
            {
              number: 2,
              title: "Questions",
            },
            {
              number: 3,
              title: "Review",
            },
          ].map((item) => {

            const active =
              step === item.number;

            const completed =
              step > item.number;

            return (

              <div
                key={item.number}
                className={`flex items-center gap-4 border p-4 transition ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : completed
                    ? "border-[var(--success)]/40 bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center font-black ${
                    active
                      ? "bg-[var(--primary)] text-white"
                      : completed
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >

                  {completed ? (
                    <Check size={19} />
                  ) : (
                    `0${item.number}`
                  )}

                </div>

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Step {item.number}
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {item.title}
                  </p>

                </div>

              </div>

            );

          })}

        </div>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        <AnimatePresence>

          {error && (

            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="mt-6 flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >

              <X size={17} />

              {typeof error === "string"
                ? error
                : "Something went wrong."}

            </motion.div>

          )}

        </AnimatePresence>


        {/* ================================================== */}
        {/* SUCCESS */}
        {/* ================================================== */}

        {success && (

          <div className="mt-6 flex items-center gap-3 border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">

            <CheckCircle2 size={17} />

            {success}

          </div>

        )}


        {/* ================================================== */}
        {/* STEP CONTENT */}
        {/* ================================================== */}

        <div className="mt-8">

          {/* ================================================= */}
          {/* STEP 1 */}
          {/* ================================================= */}

          {step === 1 && (

            <motion.div
              initial={{
                opacity: 0,
                x: 15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              className="border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8"
            >

              <div className="mb-8">

                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                  Battle details
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Define your challenge
                </h2>

              </div>


              <div className="space-y-6">

                <div>

                  <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                    Battle title
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. JavaScript Advanced Arena"
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)]"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what students will be challenged on..."
                    className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)]"
                  />

                </div>


                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                  <div>

                    <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                      Type
                    </label>

                    <select
                      name="assessment_type"
                      value={
                        form.assessment_type
                      }
                      onChange={handleChange}
                      className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm outline-none"
                    >

                      <option value="PRACTICE">
                        Practice
                      </option>

                      <option value="ASSESSMENT">
                        Assessment
                      </option>

                      <option value="BATTLE">
                        Battle
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                      Difficulty
                    </label>

                    <select
                      name="difficulty"
                      value={
                        form.difficulty
                      }
                      onChange={handleChange}
                      className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm outline-none"
                    >

                      <option value="BEGINNER">
                        Beginner
                      </option>

                      <option value="INTERMEDIATE">
                        Intermediate
                      </option>

                      <option value="ADVANCED">
                        Advanced
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                      Duration
                    </label>

                    <div className="relative">

                      <Clock3
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />

                      <input
                        type="number"
                        min="1"
                        max="300"
                        name="duration_minutes"
                        value={
                          form.duration_minutes
                        }
                        onChange={handleChange}
                        className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3.5 pl-10 pr-14 text-sm outline-none"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--muted)]">
                        MIN
                      </span>

                    </div>

                  </div>


                  <div>

                    <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                      Passing
                    </label>

                    <div className="relative">

                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="passing_percentage"
                        value={
                          form.passing_percentage
                        }
                        onChange={handleChange}
                        className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 pr-10 text-sm outline-none"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                        %
                      </span>

                    </div>

                  </div>

                </div>


                <div className="max-w-xs">

                  <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                    Maximum attempts
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="max_attempts"
                    value={
                      form.max_attempts
                    }
                    onChange={handleChange}
                    placeholder="Unlimited"
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-sm outline-none"
                  />

                </div>

              </div>

            </motion.div>

          )}


          {/* ================================================= */}
          {/* STEP 2 — QUESTION BANK */}
          {/* ================================================= */}

          {step === 2 && (

            <motion.div
              initial={{
                opacity: 0,
                x: 15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >

              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

                {/* QUESTION BANK */}

                <div className="border border-[var(--border)] bg-[var(--surface)]">

                  <div className="border-b border-[var(--border)] p-6">

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                      <div>

                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                          Question Bank
                        </p>

                        <h2 className="mt-2 text-xl font-black">
                          Choose your questions
                        </h2>

                      </div>

                      <div className="flex items-center gap-2 bg-[var(--primary-soft)] px-4 py-2 text-xs font-black text-[var(--primary)]">

                        <Layers3 size={15} />

                        {selectedQuestions.length}
                        {" "}
                        selected

                      </div>

                    </div>


                    {/* FILTERS */}

                    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_150px]">

                      <div className="relative">

                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        />

                        <input
                          value={search}
                          onChange={(event) =>
                            setSearch(
                              event.target.value
                            )
                          }
                          placeholder="Search questions or topics..."
                          className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                        />

                      </div>


                      <select
                        value={skillFilter}
                        onChange={(event) =>
                          setSkillFilter(
                            event.target.value
                          )
                        }
                        className="border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm outline-none"
                      >

                        <option value="">
                          All skills
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


                      <select
                        value={
                          difficultyFilter
                        }
                        onChange={(event) =>
                          setDifficultyFilter(
                            event.target.value
                          )
                        }
                        className="border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm outline-none"
                      >

                        <option value="">
                          All difficulty
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

                      </select>

                    </div>

                  </div>


                  {/* QUESTION LIST */}

                  <div className="max-h-[650px] overflow-y-auto p-4">

                    {loadingQuestions ? (

                      <div className="flex min-h-[300px] items-center justify-center">

                        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">

                          <Loader2
                            size={18}
                            className="animate-spin"
                          />

                          Loading question bank...

                        </div>

                      </div>

                    ) : filteredQuestions.length === 0 ? (

                      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                        <Search
                          size={32}
                          className="text-[var(--muted)]"
                        />

                        <h3 className="mt-4 font-black">
                          No questions found
                        </h3>

                        <p className="mt-2 text-sm text-[var(--muted)]">
                          Try changing your filters.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-3">

                        {filteredQuestions.map(
                          (
                            question,
                            index
                          ) => {

                            const selected =
                              isSelected(
                                question.id
                              );

                            return (

                              <motion.button
                                type="button"
                                key={
                                  question.id
                                }
                                onClick={() =>
                                  toggleQuestion(
                                    question
                                  )
                                }
                                whileHover={{
                                  y: -1,
                                }}
                                className={`w-full border p-4 text-left transition ${
                                  selected
                                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                                    : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary)]/50"
                                }`}
                              >

                                <div className="flex gap-4">

                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                                      selected
                                        ? "bg-[var(--primary)] text-white"
                                        : "bg-[var(--surface)] text-[var(--muted)]"
                                    }`}
                                  >

                                    {selected ? (
                                      <Check
                                        size={16}
                                      />
                                    ) : (
                                      <span className="text-[10px] font-black">
                                        {index +
                                          1}
                                      </span>
                                    )}

                                  </div>


                                  <div className="min-w-0 flex-1">

                                    <div className="flex flex-wrap items-center gap-2">

                                      {question.topic && (

                                        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">
                                          {
                                            question.topic
                                          }
                                        </span>

                                      )}

                                      <span className="text-[9px] font-black uppercase text-[var(--muted)]">
                                        {
                                          question.difficulty
                                        }
                                      </span>

                                      <span className="text-[9px] font-black text-[var(--muted)]">
                                        {
                                          question.marks
                                        }{" "}
                                        mark
                                      </span>

                                    </div>


                                    <p className="mt-2 text-sm font-semibold leading-6">
                                      {
                                        question.question_text
                                      }
                                    </p>


                                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">

                                      <Layers3
                                        size={12}
                                      />

                                      {skills.find(
                                        (skill) =>
                                          skill.id ===
                                          question.skill_id
                                      )?.name ||
                                        `Skill #${question.skill_id}`}

                                    </div>

                                  </div>

                                </div>

                              </motion.button>

                            );

                          }
                        )}

                      </div>

                    )}

                  </div>

                </div>


                {/* SELECTED QUESTIONS */}

                <div className="h-fit border border-[var(--border)] bg-[var(--surface)]">

                  <div className="border-b border-[var(--border)] p-5">

                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                      Battle Queue
                    </p>

                    <h3 className="mt-2 font-black">
                      Selected questions
                    </h3>

                  </div>


                  <div className="max-h-[550px] overflow-y-auto p-4">

                    {selectedQuestions.length === 0 ? (

                      <div className="py-12 text-center">

                        <Swords
                          size={28}
                          className="mx-auto text-[var(--muted)]"
                        />

                        <p className="mt-4 text-sm font-bold">
                          No questions selected
                        </p>

                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          Select questions from the
                          bank to build this battle.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-2">

                        {selectedQuestions.map(
                          (
                            question,
                            index
                          ) => (

                            <div
                              key={
                                question.id
                              }
                              className="flex gap-3 border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                            >

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--primary)] text-[10px] font-black text-white">
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">

                                <p className="line-clamp-2 text-xs font-semibold leading-5">
                                  {
                                    question.question_text
                                  }
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSelectedQuestion(
                                    question.id
                                  )
                                }
                                className="shrink-0 text-[var(--muted)] transition hover:text-red-400"
                              >

                                <X
                                  size={15}
                                />

                              </button>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                </div>

              </div>

            </motion.div>

          )}


          {/* ================================================= */}
          {/* STEP 3 — REVIEW */}
          {/* ================================================= */}

          {step === 3 && (

            <motion.div
              initial={{
                opacity: 0,
                x: 15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >

              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                {/* SUMMARY */}

                <div className="border border-[var(--border)] bg-[var(--surface)] p-7">

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                    Final review
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {form.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {form.description ||
                      "No description provided."}
                  </p>


                  <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">

                    <div className="bg-[var(--surface-soft)] p-4">

                      <Clock3
                        size={16}
                        className="text-[var(--primary)]"
                      />

                      <p className="mt-3 text-lg font-black">
                        {
                          form.duration_minutes
                        }m
                      </p>

                      <p className="text-[10px] text-[var(--muted)]">
                        Duration
                      </p>

                    </div>


                    <div className="bg-[var(--surface-soft)] p-4">

                      <Trophy
                        size={16}
                        className="text-[var(--primary)]"
                      />

                      <p className="mt-3 text-lg font-black">
                        {
                          form.passing_percentage
                        }%
                      </p>

                      <p className="text-[10px] text-[var(--muted)]">
                        Passing
                      </p>

                    </div>


                    <div className="bg-[var(--surface-soft)] p-4">

                      <Layers3
                        size={16}
                        className="text-[var(--primary)]"
                      />

                      <p className="mt-3 text-lg font-black">
                        {
                          selectedQuestions.length
                        }
                      </p>

                      <p className="text-[10px] text-[var(--muted)]">
                        Questions
                      </p>

                    </div>


                    <div className="bg-[var(--surface-soft)] p-4">

                      <Swords
                        size={16}
                        className="text-[var(--primary)]"
                      />

                      <p className="mt-3 text-lg font-black">
                        {
                          form.difficulty
                        }
                      </p>

                      <p className="text-[10px] text-[var(--muted)]">
                        Difficulty
                      </p>

                    </div>

                  </div>


                  <div className="mt-8">

                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Questions
                    </h3>

                    <div className="mt-4 space-y-2">

                      {selectedQuestions.map(
                        (
                          question,
                          index
                        ) => (

                          <div
                            key={
                              question.id
                            }
                            className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                          >

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--primary)] text-xs font-black text-white">
                              {index + 1}
                            </div>

                            <p className="text-sm font-semibold">
                              {
                                question.question_text
                              }
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                </div>


                {/* CREATE CARD */}

                <div className="h-fit border border-[var(--primary)]/30 bg-[var(--primary-soft)] p-7">

                  <div className="flex h-12 w-12 items-center justify-center bg-[var(--primary)] text-white">

                    <Swords
                      size={21}
                    />

                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    Ready for battle?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Your battle will be created as a
                    draft. You can review and publish
                    it from the assessment manager.
                  </p>


                  <button
                    type="button"
                    disabled={saving}
                    onClick={
                      handleCreateBattle
                    }
                    className="mt-7 flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-5 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {saving ? (

                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Creating Battle...

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

              </div>

            </motion.div>

          )}

        </div>


        {/* ================================================== */}
        {/* NAVIGATION */}
        {/* ================================================== */}

        <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">

          <button
            type="button"
            onClick={previousStep}
            disabled={step === 1 || saving}
            className="flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >

            <ArrowLeft size={15} />

            Back

          </button>


          {step < 3 && (

            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
            >

              Continue

              <ArrowRight size={15} />

            </button>

          )}

        </div>

      </main>

    </div>

  );
}