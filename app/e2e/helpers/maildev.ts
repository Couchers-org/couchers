/**
 * MailDev REST API helper.
 *
 * MailDev exposes a simple JSON API on its web port (default 1080).
 * See: https://github.com/maildev/maildev/blob/master/docs/rest.md
 */

const MAILDEV_URL = process.env.MAILDEV_URL || "http://localhost:1080";

interface MailDevEmail {
  id: string;
  from: { address: string; name: string }[];
  to: { address: string; name: string }[];
  subject: string;
  text: string;
  html: string;
  time: string;
}

/** Fetch all emails from MailDev */
export async function getAllEmails(): Promise<MailDevEmail[]> {
  const res = await fetch(`${MAILDEV_URL}/email`);
  if (!res.ok) throw new Error(`MailDev API error: ${res.status}`);
  return res.json();
}

/** Delete all emails in MailDev */
export async function deleteAllEmails(): Promise<void> {
  const res = await fetch(`${MAILDEV_URL}/email/all`, { method: "DELETE" });
  if (!res.ok) throw new Error(`MailDev delete error: ${res.status}`);
}

/**
 * Wait for an email matching a predicate, polling MailDev.
 * Returns the first matching email.
 */
export async function waitForEmail(
  predicate: (email: MailDevEmail) => boolean,
  { timeout = 30_000, interval = 1_000 } = {},
): Promise<MailDevEmail> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const emails = await getAllEmails();
    const match = emails.find(predicate);
    if (match) return match;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timed out waiting for email (${timeout}ms)`);
}

/**
 * Wait for an email sent to a specific address and extract the signup
 * verification token from it.
 */
export async function getSignupToken(emailAddress: string): Promise<string> {
  const email = await waitForEmail(
    (e) =>
      e.to.some(
        (t) => t.address.toLowerCase() === emailAddress.toLowerCase(),
      ) && (e.html.includes("/signup?token=") || e.text.includes("/signup?token=")),
  );

  // Extract token from the email body (HTML or text)
  const body = email.html || email.text;
  const match = body.match(/\/signup\?token=([a-zA-Z0-9_\-+=]+)/);
  if (!match) {
    throw new Error(
      `Could not extract signup token from email to ${emailAddress}`,
    );
  }
  return match[1];
}
