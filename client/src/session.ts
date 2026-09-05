const TEAM_KEY = "scavengerhunt.teamId";
const ADMIN_KEY = "scavengerhunt.adminPasscode";

export function getStoredTeamId(): string | null {
  return localStorage.getItem(TEAM_KEY);
}

export function setStoredTeamId(teamId: string) {
  localStorage.setItem(TEAM_KEY, teamId);
}

export function clearStoredTeamId() {
  localStorage.removeItem(TEAM_KEY);
}

export function getStoredAdminPasscode(): string | null {
  return sessionStorage.getItem(ADMIN_KEY);
}

export function setStoredAdminPasscode(passcode: string) {
  sessionStorage.setItem(ADMIN_KEY, passcode);
}

export function clearStoredAdminPasscode() {
  sessionStorage.removeItem(ADMIN_KEY);
}
