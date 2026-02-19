import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.PUBLIC_API_URL || 'http://localhost:3000'; // e.g. https://api.osmagent.com
const FROM = 'OSM <noreply@osmagent.com>';

export async function sendVerificationEmail(email, username, token) {
  const link = `${BASE_URL}/auth/verify/${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirm your OSM account',
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#0d0d0d;color:#e5e5e5;border-radius:8px">
        <h2 style="color:#a78bfa;margin-top:0">osm — verify your account</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Click the link below to verify your email address and activate your account:</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#a78bfa;color:#0d0d0d;text-decoration:none;border-radius:4px;font-weight:bold">
          Verify account
        </a>
        <p style="font-size:12px;color:#888">Or paste this URL in your browser:<br>${link}</p>
        <p style="font-size:12px;color:#888">If you did not create an OSM account, you can safely ignore this email.</p>
        <hr style="border-color:#333;margin:24px 0">
        <p style="font-size:11px;color:#555;margin:0">osmagent.com</p>
      </div>
    `,
  });
}
