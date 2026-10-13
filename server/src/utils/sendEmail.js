const escapeHtml = (str = "") =>
    String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const sendBrevoEmail = async ({ to, subject, html, text, replyTo }) => {
    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error("BREVO_API_KEY or EMAIL_FROM is not configured");
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            sender: { name: "BookStore", email: process.env.EMAIL_FROM },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            ...(text && { textContent: text }),
            ...(replyTo && { replyTo: { email: replyTo } }),
        }),
        signal: AbortSignal.timeout(10000), // fail fast instead of hanging into a 502
    });

    if (!res.ok) {
        throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    }
};

// contact form 
export const sendContactEmail = async ({ name, email, subject, message }) => {
    await sendBrevoEmail({
        to: process.env.CONTACT_RECEIVER_EMAIL,
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        text: `From: ${name} (${email})\n\n${message}`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
                <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                <hr />
                <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
            </div>
        `,
    });
};

// password reset 
export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
    await sendBrevoEmail({
        to,
        subject: "Reset your BookStore password",
        text: `Hi ${fullName || ""},\n\nWe received a request to reset your password. This link expires in 10 minutes:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <p>Hi ${escapeHtml(fullName) || "there"},</p>
                <p>We received a request to reset your password. This link expires in <strong>10 minutes</strong>.</p>
                <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset your password</a></p>
                <p style="color:#666;font-size:13px;">Or paste this link into your browser:<br/>${resetUrl}</p>
                <hr />
                <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    });
};