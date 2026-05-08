const adminEmails = (process.env.STEPCORRECT_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return adminEmails.includes(email.trim().toLowerCase());
}

export function hasAdminEmailsConfigured() {
  return adminEmails.length > 0;
}
