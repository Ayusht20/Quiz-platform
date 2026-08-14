import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createQuestion,
  getSkills,
} from "../../services/adminAssessmentService";


const createEmptyOption = () => ({
  option_text: "",
  is_correct: false,
});


export default function QuestionEditor() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState({
    skill_id: "",
    question_text: "",
    difficulty: "EASY",
    marks: 1,
    explanation: "",
    options: [
      createEmptyOption(),
      createEmptyOption(),
      createEmptyOption(),
      createEmptyOption(),
    ],
  });


  useEffect(() => {
    loadSkills();
  }, []);


  const loadSkills = async () => {
    try {
      setLoadingSkills(true);

      const data = await getSkills();

      setSkills(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load skills."
      );
    } finally {
      setLoadingSkills(false);
    }
  };


  const updateQuestion = (
    field,
    value
  ) => {
    setQuestion((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  const updateOption = (
    optionIndex,
    value
  ) => {
    setQuestion((previous) => ({
      ...previous,

      options: previous.options.map(
        (option, index) =>
          index === optionIndex
            ? {
                ...option,
                option_text: value,
              }
            : option
      ),
    }));
  };


  const selectCorrect = (
    optionIndex
  ) => {
    setQuestion((previous) => ({
      ...previous,

      options: previous.options.map(
        (option, index) => ({
          ...option,
          is_correct:
            index === optionIndex,
        })
      ),
    }));
  };


  const addOption = () => {
    if (question.options.length >= 6) {
      return;
    }

    setQuestion((previous) => ({
      ...previous,

      options: [
        ...previous.options,
        createEmptyOption(),
      ],
    }));
  };


  const removeOption = (
    optionIndex
  ) => {
    if (question.options.length <= 2) {
      return;
    }

    setQuestion((previous) => ({
      ...previous,

      options: previous.options.filter(
        (_, index) =>
          index !== optionIndex
      ),
    }));
  };


  const validate = () => {
    if (!question.skill_id) {
      return "Please select a skill.";
    }

    if (
      !question.question_text.trim()
    ) {
      return "Question text is required.";
    }

    if (question.options.length < 2) {
      return "At least 2 options are required.";
    }

    const emptyOption =
      question.options.some(
        (option) =>
          !option.option_text.trim()
      );

    if (emptyOption) {
      return "Please fill all options.";
    }

    const correctCount =
      question.options.filter(
        (option) =>
          option.is_correct
      ).length;

    if (correctCount !== 1) {
      return "Select exactly one correct answer.";
    }

    return null;
  };


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const validation =
      validate();

    if (validation) {
      setError(validation);
      return;
    }

    try {
      setSaving(true);

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

      navigate(
        "/admin/questions"
      );

    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.detail ||
          "Failed to create question."
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-4xl px-5 py-8 lg:px-8">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/questions"
            )
          }
          className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
        >
          <ArrowLeft size={17} />
          Question Bank
        </button>


        <div className="mt-8">

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Question Bank
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Create Question
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Add a question that can later be
            reused across multiple battles.
          </p>

        </div>


        {error && (
          <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
        >

          {/* SKILL / DIFFICULTY */}

          <div className="grid gap-5 md:grid-cols-3">

            <div className="md:col-span-2">

              <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                Skill
              </label>

              <select
                value={question.skill_id}
                disabled={loadingSkills}
                onChange={(event) =>
                  updateQuestion(
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


            <div>

              <label className="mb-2 block text-xs font-black uppercase tracking-wider">
                Difficulty
              </label>

              <select
                value={
                  question.difficulty
                }
                onChange={(event) =>
                  updateQuestion(
                    "difficulty",
                    event.target.value
                  )
                }
                className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
              >

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


          {/* QUESTION */}

          <div className="mt-6">

            <label className="mb-2 block text-xs font-black uppercase tracking-wider">
              Question
            </label>

            <textarea
              value={
                question.question_text
              }
              onChange={(event) =>
                updateQuestion(
                  "question_text",
                  event.target.value
                )
              }
              rows={5}
              placeholder="Write the question..."
              className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            />

          </div>


          {/* MARKS */}

          <div className="mt-6 max-w-xs">

            <label className="mb-2 block text-xs font-black uppercase tracking-wider">
              Marks
            </label>

            <input
              type="number"
              min="1"
              value={question.marks}
              onChange={(event) =>
                updateQuestion(
                  "marks",
                  event.target.value
                )
              }
              className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            />

          </div>


          {/* OPTIONS */}

          <div className="mt-8">

            <div className="flex items-center justify-between">

              <div>

                <label className="text-xs font-black uppercase tracking-wider">
                  Answer Options
                </label>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Click the letter to mark the
                  correct answer.
                </p>

              </div>


              {question.options.length <
                6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]"
                >
                  <Plus size={14} />
                  Add Option
                </button>
              )}

            </div>


            <div className="mt-4 space-y-3">

              {question.options.map(
                (option, index) => (

                  <div
                    key={index}
                    className={`flex items-center gap-3 border p-2 ${
                      option.is_correct
                        ? "border-[var(--success)]/50 bg-[var(--success)]/5"
                        : "border-[var(--border)] bg-[var(--surface-soft)]"
                    }`}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        selectCorrect(
                          index
                        )
                      }
                      className={`flex h-10 w-10 shrink-0 items-center justify-center border text-xs font-black ${
                        option.is_correct
                          ? "border-[var(--success)] bg-[var(--success)] text-white"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {option.is_correct ? (
                        <Check size={16} />
                      ) : (
                        String.fromCharCode(
                          65 + index
                        )
                      )}
                    </button>


                    <input
                      value={
                        option.option_text
                      }
                      onChange={(event) =>
                        updateOption(
                          index,
                          event.target.value
                        )
                      }
                      placeholder={`Option ${String.fromCharCode(
                        65 + index
                      )}`}
                      className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
                    />


                    {question.options
                      .length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeOption(
                            index
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center text-[var(--muted)] hover:text-red-400"
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    )}

                  </div>

                )
              )}

            </div>

          </div>


          {/* EXPLANATION */}

          <div className="mt-8">

            <label className="mb-2 block text-xs font-black uppercase tracking-wider">
              Explanation
              <span className="ml-2 text-[var(--muted)]">
                Optional
              </span>
            </label>

            <textarea
              value={
                question.explanation
              }
              onChange={(event) =>
                updateQuestion(
                  "explanation",
                  event.target.value
                )
              }
              rows={4}
              placeholder="Explain the correct answer..."
              className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            />

          </div>


          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/questions"
                )
              }
              className="border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
            >
              <Save size={15} />

              {saving
                ? "Saving..."
                : "Save Question"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}