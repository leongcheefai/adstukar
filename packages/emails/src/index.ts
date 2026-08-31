import { render } from "@react-email/render";
import { project } from "@repo/config/project";
import { serverEnv } from "@repo/env";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { ChangeEmailEmail } from "./templates/change-email";
import { DeleteAccountEmail } from "./templates/delete-account";
import { PaymentFailedEmail } from "./templates/payment-failed";
import { ResetPasswordEmail } from "./templates/reset-password";
import { VerifyEmail } from "./templates/verify-email";
import { WelcomeEmail } from "./templates/welcome";

const FROM = `${project.name} <${project.email.from}>`;

const resend = serverEnv.RESEND_API_KEY ? new Resend(serverEnv.RESEND_API_KEY) : null;

async function send(to: string, subject: string, element: ReactElement) {
  if (!resend) {
    console.warn(`[emails] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  const html = await render(element);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[emails] resend error", error);
    throw new Error(error.message);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send(to, `Welcome to ${project.name}`, WelcomeEmail({ name }));
}

export async function sendVerifyEmail(to: string, url: string) {
  await send(to, "Verify your email", VerifyEmail({ url }));
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(to, "Reset your password", ResetPasswordEmail({ url }));
}

export async function sendPaymentFailedEmail(to: string, appUrl: string) {
  await send(to, "Action required: payment failed", PaymentFailedEmail({ appUrl }));
}

export async function sendChangeEmailConfirmationEmail(to: string, url: string, oldEmail: string) {
  await send(to, "Confirm your new email address", ChangeEmailEmail({ url, oldEmail }));
}

export async function sendDeleteAccountEmail(to: string, url: string) {
  await send(to, "Confirm account deletion", DeleteAccountEmail({ url }));
}
