import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  otp: string;
  type: "verification" | "reset";
  userName?: string;
}

export async function sendOtpEmail({
  to,
  subject,
  otp,
  type,
  userName = "Duo Member",
}: SendEmailParams): Promise<{ success: boolean; sentViaSmtp: boolean; error?: string }> {
  const titleText =
    type === "verification"
      ? "Verify Your Email Address"
      : "Reset Your NishSplit Password";

  const bodyText =
    type === "verification"
      ? `Welcome to NishSplit! Use the verification code below to verify your email and activate your duo space account.`
      : `We received a request to reset the password for your NishSplit account. Use the recovery code below to set a new password.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 32px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: #18181b; color: #ffffff; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        h1 { font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0; }
        p { font-size: 14px; line-height: 1.6; color: #71717a; margin: 0 0 20px 0; }
        .otp-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #09090b; }
        .footer { font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 24px; border-top: 1px solid #f4f4f5; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">N</div>
        <h1>${titleText}</h1>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>${bodyText}</p>
        
        <div class="otp-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #71717a; margin-bottom: 6px;">Your 6-Digit OTP Code</div>
          <div class="otp-code">${otp}</div>
        </div>

        <p style="font-size: 12px; color: #a1a1aa;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        
        <div class="footer">
          NishSplit • Private Duo Expense Splitter
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Check for Gmail SMTP / Standard SMTP first (Sends to ANY recipient)
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD)?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM || `"NishSplit" <${user || "no-reply@nishsplit.app"}>`;

  if (user && pass) {
    try {
      const isGmail = user.toLowerCase().includes("@gmail.com");
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: "gmail",
              auth: {
                user,
                pass,
              },
            }
          : {
              host: process.env.SMTP_HOST || "smtp.gmail.com",
              port: Number(process.env.SMTP_PORT) || 587,
              secure: Number(process.env.SMTP_PORT) === 465,
              auth: {
                user,
                pass,
              },
            }
      );

      await transporter.sendMail({
        from,
        to,
        subject: `[NishSplit] ${subject} - Code: ${otp}`,
        text: `Hi ${userName},\n\nYour 6-digit NishSplit code is: ${otp}\n\nIt expires in 15 minutes.`,
        html: htmlContent,
      });

      console.log(`[SMTP EMAIL DELIVERED] Successfully sent email to ${to} via Gmail SMTP`);
      return { success: true, sentViaSmtp: true };
    } catch (err: any) {
      console.error("[SMTP ERROR] Failed to send email via SMTP:", err);
      return { success: false, sentViaSmtp: false, error: err.message };
    }
  }

  // 2. Resend API Key fallback
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || "NishSplit <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: `[NishSplit] ${subject} - Code: ${otp}`,
          html: htmlContent,
          text: `Hi ${userName},\n\nYour 6-digit NishSplit code is: ${otp}\n\nIt expires in 15 minutes.`,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        console.log(`[RESEND EMAIL DELIVERED] Email sent to ${to} via Resend`);
        return { success: true, sentViaSmtp: true };
      } else {
        console.error("[RESEND ERROR]", resData);
      }
    } catch (err: any) {
      console.error("[RESEND FETCH ERROR]", err);
    }
  }

  // Fallback notice
  console.log(`[EMAIL NOTICE] No SMTP/Resend configured. Generated OTP for ${to}: ${otp}`);
  return { success: true, sentViaSmtp: false };
}
