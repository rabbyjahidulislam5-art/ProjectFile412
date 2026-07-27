// Module 0 §1 design tokens, translated to inline styles for email-client compatibility.
const COLORS = {
  bgPrimary: "#0B0E14",
  bgSurface: "#151A24",
  bgElevated: "#1E2530",
  accentPrimary: "#C9A227",
  accentSecondary: "#2ED2C4",
  danger: "#FF4D4F",
  textPrimary: "#F5F6F8",
  textSecondary: "#8A93A3",
  borderSubtle: "#2A2F3A",
};

function baseLayout(opts: { title: string; preheader: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bgPrimary};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:${COLORS.bgPrimary};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bgPrimary};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${COLORS.textPrimary};">Smart Campus</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.bgSurface};border:1px solid ${COLORS.borderSubtle};border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <span style="font-size:12px;color:${COLORS.textSecondary};">
                One wallet for everything on campus.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBlock(otp: string): string {
  return `<div style="margin:24px 0;text-align:center;">
    <span style="display:inline-block;background-color:${COLORS.bgElevated};border:1px solid ${COLORS.borderSubtle};border-radius:8px;padding:16px 24px;font-size:32px;font-weight:700;letter-spacing:0.3em;color:${COLORS.accentPrimary};font-variant-numeric:tabular-nums;">${otp}</span>
  </div>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${COLORS.textPrimary};">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${COLORS.textSecondary};">${text}</p>`;
}

export function otpVerificationEmail(params: { fullName: string; otp: string; ttlMinutes: number }): { subject: string; html: string } {
  const html = baseLayout({
    title: "Verify your email",
    preheader: `Your Smart Campus verification code is ${params.otp}`,
    bodyHtml: `
      ${heading(`Hi ${params.fullName},`)}
      ${paragraph("Use the code below to verify your university email and activate your Smart Campus account.")}
      ${otpBlock(params.otp)}
      ${paragraph(`This code expires in ${params.ttlMinutes} minutes. If you didn't create an account, you can safely ignore this email.`)}
    `,
  });
  return { subject: "Verify your Smart Campus email", html };
}

export function forgotPasswordOtpEmail(params: { fullName: string; otp: string; ttlMinutes: number }): { subject: string; html: string } {
  const html = baseLayout({
    title: "Reset your password",
    preheader: `Your Smart Campus password reset code is ${params.otp}`,
    bodyHtml: `
      ${heading(`Hi ${params.fullName},`)}
      ${paragraph("We received a request to reset your Smart Campus password. Use the code below to continue.")}
      ${otpBlock(params.otp)}
      ${paragraph(`This code expires in ${params.ttlMinutes} minutes. If you didn't request this, you can safely ignore this email — your password will not change.`)}
    `,
  });
  return { subject: "Your Smart Campus password reset code", html };
}

export function accountActivatedEmail(params: { fullName: string }): { subject: string; html: string } {
  const html = baseLayout({
    title: "Welcome to Smart Campus",
    preheader: "Your account is verified and ready to go.",
    bodyHtml: `
      ${heading(`Welcome, ${params.fullName}!`)}
      ${paragraph("Your email is verified and your Smart Campus account is now active. Your wallet has been created and you're ready to log in.")}
      ${paragraph("Pay at campus shops, settle dues and fines, and manage your student wallet — all in one place.")}
    `,
  });
  return { subject: "Your Smart Campus account is activated", html };
}

export function passwordChangedEmail(params: { fullName: string }): { subject: string; html: string } {
  const html = baseLayout({
    title: "Password changed",
    preheader: "Your Smart Campus password was just changed.",
    bodyHtml: `
      ${heading(`Hi ${params.fullName},`)}
      ${paragraph("This confirms your Smart Campus account password was just changed.")}
      ${paragraph(`If you didn't make this change, please contact Admin Office immediately.`)}
    `,
  });
  return { subject: "Your Smart Campus password was changed", html };
}
