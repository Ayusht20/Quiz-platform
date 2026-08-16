import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Target,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createQuest } from "../../services/adminQuestService";


const INITIAL_FORM = {
  title: "",
  description: "",
  quest_type: "DAILY",
  target_type: "BATTLES",
  target_value: "3",
  reward_xp: "100",
  starts_at: "",
  ends_at: "",
};


const TARGET_OPTIONS = [
  {
    group: "Battle",
    options: [
      {
        value: "BATTLES",
        label: "Complete Battles",
      },
      {
        value: "PASSED_BATTLES",
        label: "Pass Battles",
      },
      {
        value: "PERFECT_BATTLES",
        label: "Perfect Battles",
      },
    ],
  },
  {
    group: "Questions",
    options: [
      {
        value: "QUESTIONS",
        label: "Answer Questions",
      },
      {
        value: "CORRECT_ANSWERS",
        label: "Get Correct Answers",
      },
    ],
  },
  {
    group: "Progress",
    options: [
      {
        value: "XP",
        label: "Earn XP",
      },
      {
        value: "COMPLETED_SKILLS",
        label: "Complete Skills",
      },
      {
        value: "MASTERED_SKILLS",
        label: "Master Skills",
      },
    ],
  },
];


export default function CreateQuest() {

  const navigate = useNavigate();

  const [form, setForm] = useState(
    INITIAL_FORM
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

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


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    if (!form.title.trim()) {

      setError(
        "Quest title is required."
      );

      return;
    }


    // --------------------------------------------------------
    // TARGET
    // --------------------------------------------------------

    if (
      Number(form.target_value) <= 0
    ) {

      setError(
        "Target value must be greater than 0."
      );

      return;
    }


    // --------------------------------------------------------
    // XP
    // --------------------------------------------------------

    if (
      Number(form.reward_xp) <= 0
    ) {

      setError(
        "XP reward must be greater than 0."
      );

      return;
    }


    // --------------------------------------------------------
    // DATE VALIDATION
    // --------------------------------------------------------

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.ends_at) <=
        new Date(form.starts_at)
    ) {

      setError(
        "End date must be after start date."
      );

      return;
    }


    try {

      setLoading(true);


      const payload = {

        title:
          form.title.trim(),

        description:
          form.description.trim()
            ? form.description.trim()
            : null,

        quest_type:
          form.quest_type,

        target_type:
          form.target_type,

        target_value:
          Number(form.target_value),

        reward_xp:
          Number(form.reward_xp),

        starts_at:
          form.starts_at
            ? new Date(
                form.starts_at
              ).toISOString()
            : null,

        ends_at:
          form.ends_at
            ? new Date(
                form.ends_at
              ).toISOString()
            : null,
      };


      await createQuest(payload);


      setSuccess(
        "Quest created successfully."
      );


      setTimeout(() => {

        navigate(
          "/admin/quests"
        );

      }, 700);


    } catch (err) {

      console.error(
        "Failed to create quest:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to create quest."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">

      <main className="mx-auto max-w-4xl px-5 py-8 lg:px-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/quests"
              )
            }
            className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <ArrowLeft size={17} />
          </button>


          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Admin Control
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Create Quest
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create challenges that reward
              students with XP.
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-10 border border-[var(--border)] bg-[var(--surface)]"
        >

          {/* ================================================= */}
          {/* BASIC INFORMATION */}
          {/* ================================================= */}

          <div className="border-b border-[var(--border)] p-6 lg:p-8">

            <div className="mb-6">

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Basic Information
              </p>

              <h2 className="mt-1 text-lg font-black">
                Quest Details
              </h2>

            </div>


            {/* TITLE */}

            <div>

              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Quest Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Battle Ready"
                maxLength={150}
                required
                className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />

            </div>


            {/* DESCRIPTION */}

            <div className="mt-5">

              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Complete battles and earn bonus XP."
                className="w-full resize-none border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />

            </div>

          </div>


          {/* ================================================= */}
          {/* QUEST CONFIGURATION */}
          {/* ================================================= */}

          <div className="border-b border-[var(--border)] p-6 lg:p-8">

            <div className="mb-6">

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Configuration
              </p>

              <h2 className="mt-1 text-lg font-black">
                Quest Rules
              </h2>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Choose what the student must do
                to complete this quest.
              </p>

            </div>


            <div className="grid gap-5 md:grid-cols-2">

              {/* ================================================= */}
              {/* QUEST TYPE */}
              {/* ================================================= */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  Quest Type
                </label>

                <select
                  name="quest_type"
                  value={form.quest_type}
                  onChange={handleChange}
                  className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                >

                  <option value="DAILY">
                    Daily
                  </option>

                  <option value="WEEKLY">
                    Weekly
                  </option>

                  <option value="ACHIEVEMENT">
                    Achievement
                  </option>

                </select>

              </div>


              {/* ================================================= */}
              {/* TARGET TYPE */}
              {/* ================================================= */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  Target Type
                </label>

                <select
                  name="target_type"
                  value={form.target_type}
                  onChange={handleChange}
                  className="w-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                >

                  {TARGET_OPTIONS.map(
                    (group) => (
                      <optgroup
                        key={group.group}
                        label={group.group}
                      >

                        {group.options.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}

                      </optgroup>
                    )
                  )}

                </select>

              </div>


              {/* ================================================= */}
              {/* TARGET VALUE */}
              {/* ================================================= */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  Target Value
                </label>

                <div className="relative">

                  <Target
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    type="number"
                    name="target_value"
                    value={form.target_value}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                  />

                </div>

              </div>


              {/* ================================================= */}
              {/* XP REWARD */}
              {/* ================================================= */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  XP Reward
                </label>

                <div className="relative">

                  <Zap
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cyan)]"
                  />

                  <input
                    type="number"
                    name="reward_xp"
                    value={form.reward_xp}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* AVAILABILITY */}
          {/* ================================================= */}

          <div className="border-b border-[var(--border)] p-6 lg:p-8">

            <div className="mb-6">

              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                Availability
              </p>

              <h2 className="mt-1 text-lg font-black">
                Quest Schedule
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Leave dates empty for an always
                available quest.
              </p>

            </div>


            <div className="grid gap-5 md:grid-cols-2">

              {/* START */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  Start Date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={form.starts_at}
                    onChange={handleChange}
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                  />

                </div>

              </div>


              {/* END */}

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  End Date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={form.ends_at}
                    onChange={handleChange}
                    className="w-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* MESSAGES */}
          {/* ================================================= */}

          {(error || success) && (

            <div className="px-6 pt-6 lg:px-8">

              {error && (

                <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>

              )}

              {success && (

                <div className="border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
                  {success}
                </div>

              )}

            </div>

          )}


          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row sm:justify-end lg:p-8">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/quests"
                )
              }
              disabled={loading}
              className="border border-[var(--border)] px-6 py-3 text-xs font-black uppercase tracking-wider text-[var(--muted)] transition hover:text-[var(--text)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--primary)] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Quest..."
                : "Create Quest"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}