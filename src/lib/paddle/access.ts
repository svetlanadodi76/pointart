// active + trialing = paid access granted
// Do NOT revoke for scheduled_change — only revoke when status is actually canceled/paused/past_due
export function hasPaddleAccess(status: string | null): boolean {
  return status === 'active' || status === 'trialing'
}
