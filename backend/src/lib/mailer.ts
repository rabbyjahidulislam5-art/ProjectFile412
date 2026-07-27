import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_PORT === 465,
  auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD },
});

transporter.verify().then(
  () => logger.info("Mail transporter ready"),
  (error) => logger.error({ error }, "Mail transporter failed to verify — check MAIL_USER/MAIL_PASSWORD"),
);

export async function sendMail(params: { to: string; subject: string; html: string }): Promise<void> {
  await transporter.sendMail({
    from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
