import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";


export default function Questions() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);


  // ============================================================
  // QUESTIONS
  // ============================================================

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] =
    useState("");


  // ============================================================
  // PAGINATION
  // ============================================================

  const PAGE_SIZE = 25;

  const [page, setPage] =
    useState(1);

  const [totalQuestions, setTotalQuestions] =
    useState(0);


  // ============================================================
  // STATS
  // ============================================================

  const [stats, setStats] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });


  // ============================================================
  // IMPORT
  // ============================================================

  const [showImport, setShowImport] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [importing, setImporting] =
    useState(false);

  const [importResult, setImportResult] =
    useState(null);


  // ============================================================
  // LOAD QUESTIONS
  // ============================================================

  useEffect(() => {
    loadQuestions();
  }, [page]);


  const loadQuestions = async () => {

    try {

      setLoading(true);

      setError("");


      const skip =
        (page - 1) * PAGE_SIZE;


      /*
       * Optimized API request.
       *
       * Backend should support:
       *
       * GET /questions?skip=0&limit=25
       *
       * Expected optimized response:
       *
       * {
       *   items: [...],
       *   total: 250
       * }
       *
       * If backend returns a plain array,
       * this file also handles that safely.
       */

      const response = await api.get(
        "/questions",
        {
          params: {
            skip,
            limit: PAGE_SIZE,
          },
        }
      );


      const data =
        response.data;


      // ========================================================
      // HANDLE PAGINATED RESPONSE
      // ========================================================

      if (
        data &&
        !Array.isArray(data) &&
        Array.isArray(data.items)
      ) {

        setQuestions(
          data.items
        );

        setTotalQuestions(
          Number(data.total ?? data.count ?? 0)
        );

        setStats({
          total:
            Number(
              data.total ??
              data.count ??
              0
            ),

          easy:
            Number(
              data.stats?.easy ??
              data.easy ??
              0
            ),

          medium:
            Number(
              data.stats?.medium ??
              data.medium ??
              0
            ),

          hard:
            Number(
              data.stats?.hard ??
              data.hard ??
              0
            ),
        });

      }


      // ========================================================
      // FALLBACK: PLAIN ARRAY
      // ========================================================

      else if (
        Array.isArray(data)
      ) {

        setQuestions(data);

        /*
         * This fallback prevents the page from crashing if
         * the backend hasn't yet been changed to the new
         * paginated response.
         */

        setTotalQuestions(
          data.length
        );


        const easy =
          data.filter(
            (question) =>
              question.difficulty ===
              "EASY"
          ).length;


        const medium =
          data.filter(
            (question) =>
              question.difficulty ===
              "MEDIUM"
          ).length;


        const hard =
          data.filter(
            (question) =>
              question.difficulty ===
              "HARD"
          ).length;


        setStats({
          total: data.length,
          easy,
          medium,
          hard,
        });

      }


      else {

        setQuestions([]);

        setTotalQuestions(0);

        setStats({
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
        });

      }


    } catch (error) {

      console.error(
        "Failed to load questions:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Failed to load questions."
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredQuestions =
    questions.filter(
      (question) => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return true;
        }


        return (

          question.question_text
            ?.toLowerCase()
            .includes(query)

          ||

          question.topic
            ?.toLowerCase()
            .includes(query)

          ||

          question.difficulty
            ?.toLowerCase()
            .includes(query)

        );

      }
    );


  // ============================================================
  // PAGINATION INFO
  // ============================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalQuestions /
        PAGE_SIZE
      )
    );


  const hasPreviousPage =
    page > 1;


  const hasNextPage =
    page < totalPages;


  // ============================================================
  // PAGE CHANGE
  // ============================================================

  const goToPreviousPage = () => {

    if (!hasPreviousPage) {
      return;
    }

    setPage(
      (previous) =>
        previous - 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  const goToNextPage = () => {

    if (!hasNextPage) {
      return;
    }

    setPage(
      (previous) =>
        previous + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ============================================================
  // FILE SELECT
  // ============================================================

  const handleFileSelect = (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    setError("");

    setImportResult(null);


    // ----------------------------------------------------------
    // CSV VALIDATION
    // ----------------------------------------------------------

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {

      setError(
        "Please select a CSV file."
      );

      event.target.value = "";

      setSelectedFile(null);

      return;

    }


    setSelectedFile(file);

  };


  // ============================================================
  // IMPORT CSV
  // ============================================================

  const handleImport = async () => {

    if (!selectedFile) {

      setError(
        "Please select a CSV file first."
      );

      return;

    }


    try {

      setImporting(true);

      setError("");

      setImportResult(null);


      const formData =
        new FormData();


      formData.append(
        "file",
        selectedFile
      );


      const response =
        await api.post(
          "/questions/import-csv",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      const data =
        response.data;


      // ========================================================
      // SAVE RESULT
      // ========================================================

      setImportResult({

        success: true,

        created:
          data.created ?? 0,

        updated:
          data.updated ?? 0,

        skipped:
          data.skipped ?? 0,

        failed:
          data.failed ?? 0,

        total:
          data.total ??
          (
            (data.created ?? 0) +
            (data.updated ?? 0)
          ),

      });


      // ========================================================
      // RESET FILE
      // ========================================================

      setSelectedFile(null);


      if (fileInputRef.current) {

        fileInputRef.current.value =
          "";

      }


      // ========================================================
      // GO BACK TO FIRST PAGE
      // ========================================================

      setPage(1);

      // Refresh after import.
      await loadQuestions();


    } catch (error) {

      console.error(
        "CSV import failed:",
        error
      );


      const detail =
        error.response?.data?.detail;


      if (
        typeof detail ===
          "object" &&
        detail !== null
      ) {

        setError(
          detail.message ||
          "CSV import failed."
        );


        if (
          Array.isArray(
            detail.failed_rows
          )
        ) {

          console.error(
            "Failed CSV rows:",
            detail.failed_rows
          );

        }

      } else {

        setError(
          detail ||
          "CSV import failed."
        );

      }

    } finally {

      setImporting(false);

    }

  };


  // ============================================================
  // CLOSE IMPORT
  // ============================================================

  const closeImport = () => {

    if (importing) {
      return;
    }


    setShowImport(false);

    setSelectedFile(null);

    setImportResult(null);

    setError("");


    if (fileInputRef.current) {

      fileInputRef.current.value =
        "";

    }

  };


  // ============================================================
  // OPEN IMPORT
  // ============================================================

  const openImport = () => {

    setError("");

    setImportResult(null);

    setSelectedFile(null);

    setShowImport(true);

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

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Admin Control
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Question Bank
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Create, manage and bulk-import
              questions for SkillArena.
            </p>

          </div>


          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={openImport}
              className="flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >

              <Upload size={16} />

              Import CSV

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/questions/create"
                )
              }
              className="flex items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110"
            >

              <Plus size={16} />

              Create Question

            </button>

          </div>

        </div>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (

          <div className="mt-6 flex items-start gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ================================================== */}
        {/* IMPORT SUCCESS */}
        {/* ================================================== */}

        {importResult?.success && (

          <div className="mt-6 border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-4 text-sm text-[var(--success)]">

            <div className="flex items-start gap-3">

              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div>

                <p className="font-black">
                  Question bank synced
                  successfully.
                </p>


                <p className="mt-1 text-xs">

                  {importResult.total}
                  {" "}
                  questions processed


                  {importResult.created >
                    0 && (
                    <>
                      {" • "}
                      {importResult.created}
                      {" "}
                      new
                    </>
                  )}


                  {importResult.updated >
                    0 && (
                    <>
                      {" • "}
                      {importResult.updated}
                      {" "}
                      updated
                    </>
                  )}


                  {importResult.skipped >
                    0 && (
                    <>
                      {" • "}
                      {importResult.skipped}
                      {" "}
                      skipped
                    </>
                  )}

                </p>

              </div>

            </div>

          </div>

        )}


        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">


          {/* TOTAL */}

          <StatCard
            label="Total"
            value={
              loading
                ? "—"
                : stats.total
            }
          />


          {/* EASY */}

          <StatCard
            label="Easy"
            value={
              loading
                ? "—"
                : stats.easy
            }
          />


          {/* MEDIUM */}

          <StatCard
            label="Medium"
            value={
              loading
                ? "—"
                : stats.medium
            }
          />


          {/* HARD */}

          <StatCard
            label="Hard"
            value={
              loading
                ? "—"
                : stats.hard
            }
          />

        </div>


        {/* ================================================== */}
        {/* SEARCH */}
        {/* ================================================== */}

        <div className="mt-6 flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">

          <Search
            size={17}
            className="shrink-0 text-[var(--muted)]"
          />


          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search questions, topics or difficulty..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />


          {search && (

            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="text-[var(--muted)] hover:text-[var(--text)]"
            >

              <X size={16} />

            </button>

          )}

        </div>


        {/* ================================================== */}
        {/* RESULT COUNT */}
        {/* ================================================== */}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs font-bold text-[var(--muted)]">

            {loading
              ? "Loading questions..."
              : search
                ? `${filteredQuestions.length} matching questions on this page`
                : `Showing ${
                    questions.length
                  } of ${
                    totalQuestions
                  } questions`}

          </p>


          {!loading &&
            totalQuestions > 0 && (

            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">

              Page {page} of {totalPages}

            </p>

          )}

        </div>


        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (

          <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />

            <p className="mt-4 text-sm text-[var(--muted)]">
              Loading question bank...
            </p>

          </div>

        ) : filteredQuestions.length === 0 ? (

          /* ================================================= */
          /* EMPTY */
          /* ================================================= */

          <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[var(--surface-soft)] text-[var(--muted)]">

              <BookOpen size={27} />

            </div>


            <h2 className="mt-5 font-black">

              {search
                ? "No matching questions"
                : "Question bank is empty"}

            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">

              {search
                ? "Try another search term."
                : "Create your first question or import your CSV question bank."}

            </p>


            {!search && (

              <div className="mt-6 flex justify-center gap-3">

                <button
                  type="button"
                  onClick={openImport}
                  className="flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider"
                >

                  <Upload size={15} />

                  Import CSV

                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin/questions/create"
                    )
                  }
                  className="flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white"
                >

                  <Plus size={15} />

                  Create

                </button>

              </div>

            )}

          </div>

        ) : (

          /* ================================================= */
          /* QUESTIONS */
          /* ================================================= */

          <div className="mt-6 space-y-3">

            {filteredQuestions.map(
              (
                question,
                index
              ) => (

                <motion.div
                  key={question.id}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      Math.min(
                        index * 0.015,
                        0.25
                      ),
                  }}
                  className="border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)]/50"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                    {/* QUESTION INFO */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">


                        {/* TOPIC */}

                        {question.topic && (

                          <span className="bg-[var(--primary-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">

                            {question.topic}

                          </span>

                        )}


                        {/* DIFFICULTY */}

                        <span className="bg-[var(--surface-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

                          {question.difficulty}

                        </span>


                        {/* MARKS */}

                        <span className="text-[10px] font-bold text-[var(--muted)]">

                          {question.marks}{" "}

                          {question.marks ===
                            1
                            ? "mark"
                            : "marks"}

                        </span>

                      </div>


                      {/* QUESTION */}

                      <h2 className="mt-3 text-sm font-bold leading-6">

                        {question.question_text}

                      </h2>


                      {/* EXPLANATION */}

                      {question.explanation && (

                        <p className="mt-2 line-clamp-1 text-xs text-[var(--muted)]">

                          {question.explanation}

                        </p>

                      )}

                    </div>


                    {/* RIGHT INFO */}

                    <div className="flex shrink-0 items-center gap-3">

                      <div className="flex items-center gap-2 bg-[var(--surface-soft)] px-3 py-2">

                        <span className="flex h-7 w-7 items-center justify-center bg-[var(--bg)] text-xs font-black">

                          {question.options
                            ?.length || 0}

                        </span>

                        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">

                          Options

                        </span>

                      </div>

                    </div>

                  </div>

                </motion.div>

              )
            )}

          </div>

        )}


        {/* ================================================== */}
        {/* PAGINATION */}
        {/* ================================================== */}

        {!loading &&
          totalQuestions > 0 && (

          <div className="mt-6 flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] p-3">


            <button
              type="button"
              onClick={
                goToPreviousPage
              }
              disabled={
                !hasPreviousPage
              }
              className="flex items-center gap-2 border border-[var(--border)] px-4 py-2.5 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >

              <ChevronLeft
                size={15}
              />

              Previous

            </button>


            <div className="text-center">

              <p className="text-xs font-black">

                {page}

                <span className="mx-1 text-[var(--muted)]">
                  /
                </span>

                {totalPages}

              </p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Page
              </p>

            </div>


            <button
              type="button"
              onClick={
                goToNextPage
              }
              disabled={
                !hasNextPage
              }
              className="flex items-center gap-2 border border-[var(--border)] px-4 py-2.5 text-xs font-black uppercase tracking-wider transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >

              Next

              <ChevronRight
                size={15}
              />

            </button>

          </div>

        )}

      </main>


      {/* ==================================================== */}
      {/* CSV IMPORT MODAL */}
      {/* ==================================================== */}

      {showImport && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="w-full max-w-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
          >


            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                  Bulk Import
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Import Question Bank
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Sync your SkillArena CSV
                  question bank.
                </p>

              </div>


              <button
                type="button"
                onClick={closeImport}
                disabled={importing}
                className="text-[var(--muted)] transition hover:text-[var(--text)] disabled:opacity-50"
              >

                <X size={20} />

              </button>

            </div>


            {/* FILE SELECT */}

            <button
              type="button"
              disabled={importing}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-6 flex w-full flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-6 py-12 text-center transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >

              <div className="flex h-14 w-14 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">

                <FileSpreadsheet
                  size={25}
                />

              </div>


              {selectedFile ? (

                <>

                  <p className="mt-4 break-all text-sm font-black">

                    {selectedFile.name}

                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">

                    {(
                      selectedFile.size /
                      1024
                    ).toFixed(1)}

                    {" "}
                    KB

                  </p>

                </>

              ) : (

                <>

                  <p className="mt-4 text-sm font-black">
                    Select your CSV file
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    CSV files only
                  </p>

                </>

              )}

            </button>


            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={
                handleFileSelect
              }
              className="hidden"
            />


            {/* EXPECTED FORMAT */}

            <div className="mt-5 border border-[var(--border)] bg-[var(--surface-soft)] p-4">

              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                Expected columns
              </p>

              <p className="mt-2 break-words text-xs leading-5 text-[var(--muted)]">

                skill/category, topic,
                question_text, difficulty,
                marks, option_a, option_b,
                option_c, option_d,
                correct_option, explanation

              </p>

            </div>


            {/* EXISTING QUESTION WARNING */}

            <div className="mt-4 flex gap-3 border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">

              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-[var(--primary)]"
              />

              <p className="text-xs leading-5 text-[var(--muted)]">

                Existing questions are
                updated instead of duplicated
                when the same question text
                already exists for the skill.

              </p>

            </div>


            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={closeImport}
                disabled={importing}
                className="border border-[var(--border)] px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleImport
                }
                disabled={
                  !selectedFile ||
                  importing
                }
                className="flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Upload size={15} />

                {importing
                  ? "Syncing..."
                  : "Import Questions"}

              </button>

            </div>

          </motion.div>

        </div>

      )}

    </div>

  );

}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
}) {

  return (

    <div className="border border-[var(--border)] bg-[var(--surface)] p-4">

      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>

    </div>

  );

}