import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Trophy,
  Swords,
  Clock3,
  Target,
  Layers3,
  Save,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createAssessment,
  createQuestion,
  getSkills,
  addQuestionToAssessment,
  publishAssessment,
} from "../../services/adminAssessmentService";


const EMPTY_OPTION = {
  option_text: "",
  is_correct: false,
};


const createEmptyQuestion = () => ({
  skill_id: "",
  question_text: "",
  difficulty: "EASY",
  marks: 1,
  explanation: "",
  options: [
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
  ],
});


export default function CreateAssessment() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [skills, setSkills] = useState([]);

  const [loadingSkills, setLoadingSkills] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [assessmentId, setAssessmentId] =
    useState(null);


  const [assessment, setAssessment] = useState({
    title: "",
    description: "",
    assessment_type: "PRACTICE",
    difficulty: "BEGINNER",
    duration_minutes: 10,
    passing_percentage: 60,
    max_attempts: 3,
  });


  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
  ]);


  useEffect(() => {
    loadSkills();
  }, []);


  const loadSkills = async () => {
    try {
      setLoadingSkills(true);

      const data = await getSkills();

      setSkills(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load skills. Please check the backend."
      );
    } finally {
      setLoadingSkills(false);
    }
  };


  const updateAssessment = (field, value) => {
    setAssessment((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  const updateQuestion = (
    questionIndex,
    field,
    value
  ) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  };


  const updateOption = (
    questionIndex,
    optionIndex,
    field,
    value
  ) => {
    setQuestions((previous) =>
      previous.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options.map(
            (option, oIndex) =>
              oIndex === optionIndex
                ? {
                    ...option,
                    [field]: value,
                  }
                : option
          ),
        };
      })
    );
  };


  const selectCorrectOption = (
    questionIndex,
    optionIndex
  ) => {
    setQuestions((previous) =>
      previous.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options.map(
            (option, oIndex) => ({
              ...option,
              is_correct:
                oIndex === optionIndex,
            })
          ),
        };
      })
    );
  };


  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      createEmptyQuestion(),
    ]);

    setStep(2);
  };


  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) {
      return;
    }

    setQuestions((previous) =>
      previous.filter(
        (_, index) => index !== questionIndex
      )
    );
  };


  const addOption = (questionIndex) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        if (question.options.length >= 6) {
          return question;
        }

        return {
          ...question,
          options: [
            ...question.options,
            { ...EMPTY_OPTION },
          ],
        };
      })
    );
  };


  const removeOption = (
    questionIndex,
    optionIndex
  ) => {
    setQuestions((previous) =>
      previous.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        if (question.options.length <= 2) {
          return question;
        }

        const removedOption =
          question.options[optionIndex];

        return {
          ...question,
          options: question.options.filter(
            (_, index) => index !== optionIndex
          ),
          ...(removedOption.is_correct
            ? {
                options: question.options
                  .filter(
                    (_, index) =>
                      index !== optionIndex
                  )
                  .map((option) => ({
                    ...option,
                    is_correct: false,
                  })),
              }
            : {}),
        };
      })
    );
  };


  const validateAssessment = () => {
    if (!assessment.title.trim()) {
      return "Battle title is required.";
    }

    if (assessment.title.trim().length < 3) {
      return "Battle title must contain at least 3 characters.";
    }

    if (
      assessment.duration_minutes < 1 ||
      assessment.duration_minutes > 300
    ) {
      return "Duration must be between 1 and 300 minutes.";
    }

    if (
      assessment.passing_percentage < 0 ||
      assessment.passing_percentage > 100
    ) {
      return "Passing percentage must be between 0 and 100.";
    }

    return null;
  };


  const validateQuestions = () => {
    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const question = questions[index];

      if (!question.skill_id) {
        return `Select a skill for Question ${index + 1}.`;
      }

      if (!question.question_text.trim()) {
        return `Question ${index + 1} cannot be empty.`;
      }

      if (question.options.length < 2) {
        return `Question ${index + 1} needs at least 2 options.`;
      }

      const filledOptions =
        question.options.filter(
          (option) =>
            option.option_text.trim()
        );

      if (
        filledOptions.length !==
        question.options.length
      ) {
        return `Fill all options for Question ${index + 1}.`;
      }

      const correctOptions =
        question.options.filter(
          (option) => option.is_correct
        );

      if (correctOptions.length !== 1) {
        return `Select exactly one correct answer for Question ${index + 1}.`;
      }
    }

    return null;
  };


  const goToQuestions = () => {
    setError("");

    const validation =
      validateAssessment();

    if (validation) {
      setError(validation);
      return;
    }

    setStep(2);
  };


  const goToReview = () => {
    setError("");

    const validation =
      validateQuestions();

    if (validation) {
      setError(validation);
      return;
    }

    setStep(3);
  };


  const saveAssessment = async (
    shouldPublish = false
  ) => {
    try {
      setSaving(true);
      setError("");

      /*
       * STEP 1
       * Create assessment
       */

      let currentAssessmentId =
        assessmentId;

      if (!currentAssessmentId) {
        const created =
          await createAssessment({
            ...assessment,
            duration_minutes: Number(
              assessment.duration_minutes
            ),
            passing_percentage: Number(
              assessment.passing_percentage
            ),
            max_attempts:
              assessment.max_attempts
                ? Number(
                    assessment.max_attempts
                  )
                : null,
          });

        currentAssessmentId =
          created.id;

        setAssessmentId(created.id);
      }


      /*
       * STEP 2
       * Create questions
       * and attach them to assessment
       */

      if (!assessmentId) {
        for (
          let index = 0;
          index < questions.length;
          index++
        ) {
          const question =
            questions[index];

          const createdQuestion =
            await createQuestion({
              skill_id: Number(
                question.skill_id
              ),

              question_text:
                question.question_text.trim(),

              difficulty:
                question.difficulty,

              marks: Number(
                question.marks
              ),

              explanation:
                question.explanation.trim() ||
                null,

              options:
                question.options.map(
                  (option) => ({
                    option_text:
                      option.option_text.trim(),

                    is_correct:
                      option.is_correct,
                  })
                ),
            });


          await addQuestionToAssessment(
            currentAssessmentId,
            {
              question_id:
                createdQuestion.id,

              question_order:
                index + 1,
            }
          );
        }
      }


      /*
       * STEP 3
       * Publish if requested
       */

      if (shouldPublish) {
        await publishAssessment(
          currentAssessmentId
        );
      }


      /*
       * Success
       */

      navigate(
        `/admin/assessments`
      );

    } catch (err) {
      console.error(err);

      const detail =
        err?.response?.data?.detail;

      setError(
        detail ||
          "Something went wrong while saving the battle."
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4">

          <button
            onClick={() =>
              navigate("/admin/assessments")
            }
            className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft size={17} />
            Assessments
          </button>


          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
              <Swords size={17} />
            </div>

            <span className="text-xs font-black uppercase tracking-[0.2em]">
              SkillArena
            </span>

          </div>

        </div>


        {/* TITLE */}

        <div className="mt-10">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Battle Builder
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Create a new battle
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Build a challenge, add questions,
            review everything and publish it
            for students.
          </p>

        </div>


        {/* STEPPER */}

        <div className="mt-8 grid grid-cols-3 gap-2">

          {[
            {
              number: 1,
              title: "Details",
              icon: Trophy,
            },
            {
              number: 2,
              title: "Questions",
              icon: Layers3,
            },
            {
              number: 3,
              title: "Review",
              icon: Check,
            },
          ].map((item) => {

            const Icon = item.icon;

            const active =
              step === item.number;

            const completed =
              step > item.number;

            return (
              <button
                key={item.number}
                onClick={() => {
                  if (
                    item.number < step
                  ) {
                    setStep(item.number);
                  }
                }}
                className={`flex items-center gap-3 border p-3 text-left transition ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : completed
                    ? "border-[var(--success)]/30 bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center ${
                    active
                      ? "bg-[var(--primary)] text-white"
                      : completed
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >
                  {completed ? (
                    <Check size={15} />
                  ) : (
                    <Icon size={15} />
                  )}
                </div>

                <div className="hidden sm:block">

                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
                    Step {item.number}
                  </p>

                  <p className="text-sm font-black">
                    {item.title}
                  </p>

                </div>

              </button>
            );
          })}

        </div>


        {/* ERROR */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400"
          >
            {error}
          </motion.div>
        )}


        {/* STEP 1 */}

        {step === 1 && (

          <motion.section
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="mt-8"
          >

            <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">

              <div className="mb-8">

                <h2 className="text-xl font-black">
                  Battle details
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Define the rules of your battle.
                </p>

              </div>


              <div className="grid gap-6">

                {/* TITLE */}

                <div>

                  <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                    Battle Title
                  </label>

                  <input
                    value={assessment.title}
                    onChange={(event) =>
                      updateAssessment(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="e.g. JavaScript Fundamentals"
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />

                </div>


                {/* DESCRIPTION */}

                <div>

                  <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                    Description
                  </label>

                  <textarea
                    value={
                      assessment.description
                    }
                    onChange={(event) =>
                      updateAssessment(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Describe what students will learn or test..."
                    className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />

                </div>


                {/* TYPE / DIFFICULTY */}

                <div className="grid gap-6 md:grid-cols-2">

                  <SelectField
                    label="Battle Type"
                    value={
                      assessment.assessment_type
                    }
                    onChange={(value) =>
                      updateAssessment(
                        "assessment_type",
                        value
                      )
                    }
                    options={[
                      [
                        "PRACTICE",
                        "Practice",
                      ],
                      [
                        "EXAM",
                        "Exam",
                      ],
                      [
                        "CHALLENGE",
                        "Challenge",
                      ],
                    ]}
                  />


                  <SelectField
                    label="Difficulty"
                    value={
                      assessment.difficulty
                    }
                    onChange={(value) =>
                      updateAssessment(
                        "difficulty",
                        value
                      )
                    }
                    options={[
                      [
                        "BEGINNER",
                        "Beginner",
                      ],
                      [
                        "INTERMEDIATE",
                        "Intermediate",
                      ],
                      [
                        "ADVANCED",
                        "Advanced",
                      ],
                    ]}
                  />

                </div>


                {/* NUMBERS */}

                <div className="grid gap-6 sm:grid-cols-3">

                  <NumberField
                    label="Duration"
                    value={
                      assessment.duration_minutes
                    }
                    suffix="minutes"
                    onChange={(value) =>
                      updateAssessment(
                        "duration_minutes",
                        value
                      )
                    }
                  />


                  <NumberField
                    label="Passing Score"
                    value={
                      assessment.passing_percentage
                    }
                    suffix="%"
                    onChange={(value) =>
                      updateAssessment(
                        "passing_percentage",
                        value
                      )
                    }
                  />


                  <NumberField
                    label="Maximum Attempts"
                    value={
                      assessment.max_attempts
                    }
                    suffix="attempts"
                    onChange={(value) =>
                      updateAssessment(
                        "max_attempts",
                        value
                      )
                    }
                  />

                </div>

              </div>

            </div>


            <div className="mt-5 flex justify-end">

              <button
                onClick={goToQuestions}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
              >
                Continue
                <ArrowRight size={15} />
              </button>

            </div>

          </motion.section>
        )}


        {/* STEP 2 */}

        {step === 2 && (

          <motion.section
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="mt-8"
          >

            <div className="space-y-5">

              {questions.map(
                (question, questionIndex) => (

                  <QuestionCard
                    key={questionIndex}
                    question={question}
                    index={questionIndex}
                    skills={skills}
                    loadingSkills={
                      loadingSkills
                    }
                    onUpdateQuestion={
                      updateQuestion
                    }
                    onUpdateOption={
                      updateOption
                    }
                    onSelectCorrect={
                      selectCorrectOption
                    }
                    onAddOption={
                      addOption
                    }
                    onRemoveOption={
                      removeOption
                    }
                    onRemoveQuestion={
                      removeQuestion
                    }
                  />

                )
              )}

            </div>


            <button
              onClick={addQuestion}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-5 text-xs font-black uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <Plus size={16} />
              Add Another Question
            </button>


            <div className="mt-6 flex items-center justify-between gap-4">

              <button
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider"
              >
                <ArrowLeft size={15} />
                Back
              </button>


              <button
                onClick={goToReview}
                className="flex items-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white"
              >
                Review Battle
                <ArrowRight size={15} />
              </button>

            </div>

          </motion.section>
        )}


        {/* STEP 3 */}

        {step === 3 && (

          <motion.section
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="mt-8"
          >

            {/* BATTLE SUMMARY */}

            <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">

              <div className="flex flex-col justify-between gap-5 sm:flex-row">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                    Battle Preview
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {assessment.title}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    {assessment.description ||
                      "No description provided."}
                  </p>

                </div>


                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Swords size={22} />
                </div>

              </div>


              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <SummaryItem
                  icon={Clock3}
                  label="Duration"
                  value={`${assessment.duration_minutes} min`}
                />

                <SummaryItem
                  icon={Target}
                  label="Passing"
                  value={`${assessment.passing_percentage}%`}
                />

                <SummaryItem
                  icon={Layers3}
                  label="Questions"
                  value={questions.length}
                />

                <SummaryItem
                  icon={Trophy}
                  label="Attempts"
                  value={
                    assessment.max_attempts ||
                    "Unlimited"
                  }
                />

              </div>

            </div>


            {/* QUESTION REVIEW */}

            <div className="mt-5 space-y-4">

              {questions.map(
                (question, index) => {

                  const skill =
                    skills.find(
                      (item) =>
                        item.id ===
                        Number(
                          question.skill_id
                        )
                    );

                  return (
                    <div
                      key={index}
                      className="border border-[var(--border)] bg-[var(--surface)] p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div>

                            <p className="text-sm font-bold leading-6">
                              {
                                question.question_text
                              }
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">

                              <Badge>
                                {skill?.name ||
                                  "Skill"}
                              </Badge>

                              <Badge>
                                {
                                  question.difficulty
                                }
                              </Badge>

                              <Badge>
                                {question.marks} mark
                                {question.marks >
                                1
                                  ? "s"
                                  : ""}
                              </Badge>

                            </div>

                          </div>

                        </div>

                      </div>


                      <div className="mt-4 grid gap-2 sm:grid-cols-2">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => (

                            <div
                              key={
                                optionIndex
                              }
                              className={`flex items-center gap-3 border px-3 py-2 text-sm ${
                                option.is_correct
                                  ? "border-[var(--success)]/40 bg-[var(--success)]/10"
                                  : "border-[var(--border)]"
                              }`}
                            >

                              <span className="font-black text-[var(--muted)]">
                                {String.fromCharCode(
                                  65 +
                                    optionIndex
                                )}
                              </span>

                              <span>
                                {
                                  option.option_text
                                }
                              </span>

                              {option.is_correct && (
                                <Check
                                  size={14}
                                  className="ml-auto text-[var(--success)]"
                                />
                              )}

                            </div>

                          )
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>


            {/* ACTIONS */}

            <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">

              <button
                disabled={saving}
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="flex items-center justify-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                <ArrowLeft size={15} />
                Edit Questions
              </button>


              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  disabled={saving}
                  onClick={() =>
                    saveAssessment(false)
                  }
                  className="flex items-center justify-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>


                <button
                  disabled={saving}
                  onClick={() =>
                    saveAssessment(true)
                  }
                  className="flex items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  <Send size={15} />
                  {saving
                    ? "Publishing..."
                    : "Publish Battle"}
                </button>

              </div>

            </div>

          </motion.section>
        )}

      </main>

    </div>
  );
}


/* ------------------------------------------------ */
/* QUESTION CARD */
/* ------------------------------------------------ */

function QuestionCard({
  question,
  index,
  skills,
  loadingSkills,
  onUpdateQuestion,
  onUpdateOption,
  onSelectCorrect,
  onAddOption,
  onRemoveOption,
  onRemoveQuestion,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">

      {/* QUESTION HEADER */}

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary)] text-xs font-black text-white">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
              Question
            </p>

            <h3 className="font-black">
              Question {index + 1}
            </h3>

          </div>

        </div>


        {index > 0 && (
          <button
            onClick={() =>
              onRemoveQuestion(index)
            }
            className="flex h-9 w-9 items-center justify-center text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
            title="Remove question"
          >
            <Trash2 size={16} />
          </button>
        )}

      </div>


      {/* QUESTION */}

      <div className="mt-7">

        <label className="mb-2 block text-xs font-black uppercase tracking-wider">
          Question Text
        </label>

        <textarea
          value={question.question_text}
          onChange={(event) =>
            onUpdateQuestion(
              index,
              "question_text",
              event.target.value
            )
          }
          rows={4}
          placeholder="Write your question..."
          className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
        />

      </div>


      {/* META */}

      <div className="mt-5 grid gap-5 md:grid-cols-3">

        <div>

          <label className="mb-2 block text-xs font-black uppercase tracking-wider">
            Skill
          </label>

          <select
            value={question.skill_id}
            disabled={loadingSkills}
            onChange={(event) =>
              onUpdateQuestion(
                index,
                "skill_id",
                event.target.value
              )
            }
            className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
          >

            <option value="">
              {loadingSkills
                ? "Loading skills..."
                : "Select skill"}
            </option>

            {skills.map((skill) => (
              <option
                key={skill.id}
                value={skill.id}
              >
                {skill.name}
              </option>
            ))}

          </select>

        </div>


        <SelectField
          label="Difficulty"
          value={question.difficulty}
          onChange={(value) =>
            onUpdateQuestion(
              index,
              "difficulty",
              value
            )
          }
          options={[
            ["EASY", "Easy"],
            ["MEDIUM", "Medium"],
            ["HARD", "Hard"],
          ]}
        />


        <NumberField
          label="Marks"
          value={question.marks}
          suffix="marks"
          onChange={(value) =>
            onUpdateQuestion(
              index,
              "marks",
              value
            )
          }
        />

      </div>


      {/* OPTIONS */}

      <div className="mt-7">

        <div className="flex items-center justify-between">

          <div>

            <label className="text-xs font-black uppercase tracking-wider">
              Answer Options
            </label>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Click an option to mark it as correct.
            </p>

          </div>


          {question.options.length < 6 && (
            <button
              onClick={() =>
                onAddOption(index)
              }
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
            >
              <Plus size={13} />
              Add Option
            </button>
          )}

        </div>


        <div className="mt-4 grid gap-3">

          {question.options.map(
            (option, optionIndex) => (

              <div
                key={optionIndex}
                className={`flex items-center gap-3 border p-2 transition ${
                  option.is_correct
                    ? "border-[var(--success)]/50 bg-[var(--success)]/5"
                    : "border-[var(--border)] bg-[var(--surface-soft)]"
                }`}
              >

                <button
                  type="button"
                  onClick={() =>
                    onSelectCorrect(
                      index,
                      optionIndex
                    )
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border text-xs font-black ${
                    option.is_correct
                      ? "border-[var(--success)] bg-[var(--success)] text-white"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {option.is_correct ? (
                    <Check size={15} />
                  ) : (
                    String.fromCharCode(
                      65 + optionIndex
                    )
                  )}
                </button>


                <input
                  value={option.option_text}
                  onChange={(event) =>
                    onUpdateOption(
                      index,
                      optionIndex,
                      "option_text",
                      event.target.value
                    )
                  }
                  placeholder={`Option ${String.fromCharCode(
                    65 + optionIndex
                  )}`}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                />


                {question.options.length >
                  2 && (
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveOption(
                        index,
                        optionIndex
                      )
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--muted)] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

              </div>

            )
          )}

        </div>

      </div>


      {/* EXPLANATION */}

      <div className="mt-7">

        <label className="mb-2 block text-xs font-black uppercase tracking-wider">
          Explanation
          <span className="ml-2 text-[var(--muted)]">
            Optional
          </span>
        </label>

        <textarea
          value={question.explanation}
          onChange={(event) =>
            onUpdateQuestion(
              index,
              "explanation",
              event.target.value
            )
          }
          rows={3}
          placeholder="Explain why the correct answer is correct..."
          className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
        />

      </div>

    </div>
  );
}


/* ------------------------------------------------ */
/* SMALL COMPONENTS */
/* ------------------------------------------------ */

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-black uppercase tracking-wider">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
      >

        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}

      </select>

    </div>
  );
}


function NumberField({
  label,
  value,
  suffix,
  onChange,
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-black uppercase tracking-wider">
        {label}
      </label>

      <div className="relative">

        <input
          type="number"
          min="1"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 pr-20 text-sm outline-none focus:border-[var(--primary)]"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--muted)]">
          {suffix}
        </span>

      </div>

    </div>
  );
}


function SummaryItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="bg-[var(--surface-soft)] p-4">

      <Icon
        size={15}
        className="text-[var(--primary)]"
      />

      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>

    </div>
  );
}


function Badge({ children }) {
  return (
    <span className="bg-[var(--surface-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
      {children}
    </span>
  );
}