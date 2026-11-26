import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { uploadPartyPhoto } from "../api";
import { compressPhoto } from "../compress";
import { SchoolLogo } from "../components/SchoolLogo";

type Step = "form" | "compressing" | "uploading" | "done" | "error";

export function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staffName, setStaffName] = useState("");
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function onPickPhoto() {
    fileInputRef.current?.click();
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const compressed = await compressPhoto(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(compressed));
      setSelectedFile(compressed);
    } catch {
      setError("Could not prepare that photo. Try another image.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedFile || step === "uploading" || step === "compressing") return;

    const name = staffName.trim();
    if (!name) {
      setError("Please add your name.");
      return;
    }

    setError(null);
    setStep("uploading");
    try {
      const result = await uploadPartyPhoto(name, caption.trim(), selectedFile);
      setSuccessMessage(result.message);
      setStep("done");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCaption("");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function resetForAnother() {
    setStep("form");
    setError(null);
    setSuccessMessage(null);
  }

  const busy = step === "uploading" || step === "compressing";

  return (
    <div className="page-shell bg-party-mesh mx-auto min-h-dvh max-w-lg">
      <header className="mb-6 text-center">
        <SchoolLogo variant="navy" size="sm" className="mx-auto" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-sp-red">
          Staff Christmas party
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy-950">
          Share the moment
        </h1>
        <p className="mt-2 text-sm text-navy-800/70">
          Snap a selfie or party pic. An organiser approves it before it hits the
          big screen.
        </p>
      </header>

      {step === "done" ? (
        <FormCard className="text-center">
          <p className="text-4xl" aria-hidden>
            🎄
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-navy-950">
            Photo sent!
          </h2>
          <p className="mt-2 text-sm text-navy-800/75">{successMessage}</p>
          <button
            type="button"
            onClick={resetForAnother}
            className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-sp-red text-lg font-semibold text-white"
          >
            Upload another
          </button>
        </FormCard>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormCard>
            <label className="block text-sm font-semibold text-navy-900">
              Your name
            </label>
            <input
              type="text"
              name="staffName"
              autoComplete="name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              maxLength={80}
              required
              disabled={busy}
              className="mt-2 min-h-14 w-full rounded-2xl border border-navy-900/15 px-4 text-lg outline-none focus:ring-2 focus:ring-sp-gold/50"
              placeholder="e.g. Alex"
            />

            <label className="mt-4 block text-sm font-semibold text-navy-900">
              Caption{" "}
              <span className="font-normal text-navy-800/55">(optional)</span>
            </label>
            <textarea
              name="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={280}
              rows={3}
              disabled={busy}
              className="mt-2 w-full resize-none rounded-2xl border border-navy-900/15 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sp-gold/50"
              placeholder="What's happening?"
            />
          </FormCard>

          <FormCard>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={onFileChange}
            />

            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl ring-2 ring-sp-gold/40">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onPickPhoto}
                disabled={busy}
                className="flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sp-red/35 bg-sp-red/5 text-navy-900 active:bg-sp-red/10"
              >
                <span className="text-3xl" aria-hidden>
                  📷
                </span>
                <span className="text-base font-semibold">Take or choose photo</span>
              </button>
            )}

            {previewUrl ? (
              <button
                type="button"
                onClick={onPickPhoto}
                disabled={busy}
                className="mt-3 min-h-12 w-full rounded-xl bg-navy-900/8 text-sm font-semibold text-navy-900"
              >
                Change photo
              </button>
            ) : null}
          </FormCard>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!selectedFile || !staffName.trim() || busy}
            className="sticky-cta flex min-h-14 w-full items-center justify-center rounded-2xl bg-sp-red text-lg font-semibold text-white shadow-lg disabled:opacity-45"
          >
            {step === "uploading" ? "Uploading…" : "Send to the photo wall"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-xs text-navy-800/50">
        Big screen:{" "}
        <Link to="/display" className="underline underline-offset-2">
          /display
        </Link>
        {" · "}
        <Link to="/admin" className="underline underline-offset-2">
          Organiser
        </Link>
      </p>
    </div>
  );
}

function FormCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`animate-fade-up rounded-3xl bg-white/92 p-5 shadow-sm ring-1 ring-navy-900/8 ${className}`}
    >
      {children}
    </section>
  );
}