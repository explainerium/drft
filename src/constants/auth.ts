/**
 * Cookie set by the backend (src/shared/cookies.ts) for as long as a session
 * exists; its value is the user's role. A routing hint only — the API verifies
 * every request itself. Keep the name in sync with the backend.
 */
export const SESSION_COOKIE = "drft_session";

export const STAFF_ROLES = ["ADMIN", "STAFF"] as const;
