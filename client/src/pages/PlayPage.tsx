import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCurrentQuestion,
  uploadSubmission,
  type QuestionPayload,
} from "../api";
import { compressPhoto } from "../compress";
import { clearStoredTeamId, getStoredTeamId } from "../session";

type UploadState = "idle" | "compressing" | "uploading" | "accepted" | "error";

export function PlayPage() {
  const navigate = useNavigate();
  const teamId = getStoredTeamId();
  const [teamName, setTeamName] = useState<string>("");
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [progress, setProgress] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    if (!teamId) return;
    const data = await fetchCurrentQuestion(teamId);
    setTeamName(data.team.name || `Team ${data.team.number}`);
    setTeamNumber(data.team.number);
    if (data.finished) {
      navigate("/done", { replace: true });
      return;
    }
    setQuestion(data.question);
    setProgress(data.question.progressLabel);
  }, [navigate, teamId]);

  useEffect(() => {
    if (!teamId) {
      navigate("/", { replace: true });
      return;
    }
    loadQuestion().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load question"),
    );
  }, [teamId, navigate, loadQuestion]);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !teamId || uploadState === "compressing" || uploadState === "uploading") {
      return;
    }

    setError(null);
    setUploadState("compressing");
    try {
      const compressed = await compressPhoto(file);
      const localPreview = URL.createObjectURL(compressed);
      setPreviewUrl(localPreview);
      setUploadState("uploading");
      const result = await uploadSubmission(teamId, compressed);
      setUploadState("accepted");

      if (result.finished) {
        setTimeout(() => navigate("/done", { replace: true }), 1200);
        return;
      }

      setTimeout(async () => {
        setUploadState("idle");
        setPreviewUrl(null);
        URL.revokeObjectURL(localPreview);
        if (result.nextQuestion) {
          setQuestion(result.nextQuestion);
          setProgress(result.nextQuestion.progressLabel);
        } else {
          await loadQuestion();
        }
      }, 1400);
    } catch (err) {
      setUploadState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (!teamId) return null;

  return (
    <div className="bg-mesh mx-auto min-h-dvh max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/70">
          Team {teamNumber} · {progress}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-teal-950">
          {teamName}
        </h1>
      </div>

      {question ? (
        <section className="animate-fade-up rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-teal-900/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">
            Your clue
          </p>
          <p className="mt-3 text-lg leading-relaxed text-teal-950">
            {question.clueText}
          </p>
          <p className="mt-4 text-sm text-teal-900/65">
            Get everyone in the shot — and make sure your name sign is visible.
          </p>
        </section>
      ) : (
        <p className="text-center text-teal-900/70">Loading your question…</p>
      )}

      <div className="mt-6 animate-fade-up">
        <label
          className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-base font-semibold transition ${
            uploadState === "compressing" || uploadState === "uploading"
              ? "bg-teal-900/40 text-white"
              : uploadState === "accepted"
                ? "bg-teal-700 text-white"
                : "bg-teal-900 text-white hover:bg-teal-800"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={
              !question ||
              uploadState === "compressing" ||
              uploadState === "uploading" ||
              uploadState === "accepted"
            }
            onChange={onFileChange}
          />
          {uploadState === "idle" || uploadState === "error"
            ? "Take or upload photo"
            : uploadState === "compressing"
              ? "Compressing…"
              : uploadState === "uploading"
                ? "Uploading…"
                : "Accepted — next clue coming up"}
        </label>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Upload preview"
            className="mt-4 max-h-56 w-full rounded-2xl object-cover ring-1 ring-teal-900/10"
          />
        ) : null}

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          clearStoredTeamId();
          navigate("/");
        }}
        className="mt-8 block w-full text-center text-xs text-teal-900/45 underline-offset-2 hover:underline"
      >
        Switch device / leave session
      </button>
      <p className="mt-2 text-center text-xs text-teal-900/40">
        <Link to="/">Team grid</Link>
      </p>
    </div>
  );
}
