import { Resend } from "resend";
import { createBreakingNewsEmail, type BreakingNewsArticle } from "./templates";

export type BreakingNewsTargetUser = {
  email: string;
  fullName?: string | null;
};

const BATCH_SIZE = 100;
let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendBreakingNewsEmail(article: BreakingNewsArticle, targetUsers: BreakingNewsTargetUser[]) {
  if (!targetUsers.length) return { sent: 0, failed: 0 };
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured.");

  const resend = getResendClient();
  const recipients = targetUsers.filter((user) => user.email.trim());
  let sent = 0;
  let failed = targetUsers.length - recipients.length;

  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE).map((user) => {
      const email = createBreakingNewsEmail(article, user.fullName);
      return { from, to: user.email, subject: email.subject, html: email.html };
    });
    const { data, error } = await resend.batch.send(batch);
    if (error) {
      failed += batch.length;
    } else {
      sent += data?.data?.length ?? batch.length;
      failed += Math.max(0, batch.length - (data?.data?.length ?? batch.length));
    }
  }

  return { sent, failed };
}