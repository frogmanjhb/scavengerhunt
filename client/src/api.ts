export type TeamSummary = {
  id: string;
  number: number;
  name: string | null;
  claimed: boolean;
};

export type QuestionPayload = {
  locationId: string;
  orderIndex: number;
  clueText: string;
  hint: string | null;
  progressLabel: string;
};

export type CurrentQuestionResponse =
  | {
      finished: true;
      team: {
        id: string;
        number: number;
        name: string | null;
        currentStep: number;
        total: number;
      };
    }
  | {
      finished: false;
      team: {
        id: string;
        number: number;
        name: string | null;
        currentStep: number;
        total: number;
      };
      question: QuestionPayload;
    };

export type MosaicSubmission = {
  id: string;
  photoUrl: string;
  caption: string | null;
  createdAt: string;
  teamNumber: number;
  teamName: string;
  locationOrderIndex: number;
};

export type AdminOverview = {
  finishedCount: number;
  totalTeams: number;
  teams: Array<{
    id: string;
    number: number;
    name: string | null;
    claimed: boolean;
    currentStep: number;
    startIndex: number;
    completed: number;
    finished: boolean;
  }>;
  recentSubmissions: Array<{
    id: string;
    photoUrl: string;
    hidden: boolean;
    createdAt: string;
    teamNumber: number;
    teamName: string;
    locationOrderIndex: number;
    clueText: string;
  }>;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchTeams() {
  const res = await fetch("/api/teams");
  return parseJson<TeamSummary[]>(res);
}

export async function claimTeam(teamId: string, name: string) {
  const res = await fetch(`/api/teams/${teamId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return parseJson<TeamSummary & { startIndex: number; currentStep: number }>(res);
}

export async function fetchCurrentQuestion(teamId: string) {
  const res = await fetch(`/api/teams/${teamId}/current-question`);
  return parseJson<CurrentQuestionResponse>(res);
}

export async function uploadSubmission(teamId: string, photo: Blob) {
  const form = new FormData();
  form.append("teamId", teamId);
  form.append("photo", photo, "photo.jpg");
  const res = await fetch("/api/submissions", {
    method: "POST",
    body: form,
  });
  return parseJson<{
    ok: boolean;
    finished: boolean;
    submissionId: string;
    photoUrl: string;
    nextQuestion?: QuestionPayload | null;
    team: {
      id: string;
      number: number;
      name: string | null;
      currentStep: number;
      total: number;
    };
  }>(res);
}

export async function fetchRecentSubmissions(after?: string) {
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  const res = await fetch(`/api/submissions/recent${qs}`);
  return parseJson<MosaicSubmission[]>(res);
}

export async function fetchAdminOverview(passcode: string) {
  const res = await fetch("/api/admin/overview", {
    headers: { "X-Admin-Passcode": passcode },
  });
  return parseJson<AdminOverview>(res);
}

export async function setSubmissionHidden(
  passcode: string,
  id: string,
  hidden: boolean,
) {
  const res = await fetch(`/api/admin/submissions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Passcode": passcode,
    },
    body: JSON.stringify({ hidden }),
  });
  return parseJson(res);
}

export async function adminRenameTeam(
  passcode: string,
  id: string,
  name: string,
) {
  const res = await fetch(`/api/admin/teams/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Passcode": passcode,
    },
    body: JSON.stringify({ name }),
  });
  return parseJson(res);
}

export async function adminReleaseTeam(passcode: string, id: string) {
  const res = await fetch(`/api/admin/teams/${id}/release`, {
    method: "POST",
    headers: { "X-Admin-Passcode": passcode },
  });
  return parseJson(res);
}

export async function adminResetAll(passcode: string) {
  const res = await fetch("/api/admin/reset", {
    method: "POST",
    headers: { "X-Admin-Passcode": passcode },
  });
  return parseJson<{ ok: boolean }>(res);
}
