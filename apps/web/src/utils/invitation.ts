import { randomBytes } from "crypto";

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate invitation link
 */
export function generateInvitationLink(
  token: string,
  baseUrl?: string,
): string {
  const base = baseUrl || window.location.origin;
  return `${base}/invitation/${token}`;
}

/**
 * Calculate expiration date (7 days from now)
 */
export function calculateExpirationDate(): number {
  const now = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return now + sevenDaysInMs;
}
