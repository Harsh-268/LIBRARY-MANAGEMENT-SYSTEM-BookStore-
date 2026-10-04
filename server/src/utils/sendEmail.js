import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    family: 4 // force IPv4
});

// sends the contact form message to the configured receiver address
// throws on failure so the caller can decide how to handle it (we don't want
// an email failure to block the fact that the message was already saved to the DB)
export const sendContactEmail = async ({ name, email, subject, message }) => {
    await transporter.sendMail({
        from: `"BookStore Contact Form" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: process.env.CONTACT_RECEIVER_EMAIL,
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        text: `From: ${name} (${email})\n\n${message}`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr />
                <p>${message.replace(/\n/g, "<br/>")}</p>
            </div>
        `
    });
};

// sends the password reset link to the user's own email
// same best-effort contract as sendContactEmail: throws on failure so the
// caller (forgotPassword) decides how to handle it — the reset token is
// already saved to the DB before this is called, so a mail failure here
// shouldn't be treated as if the request itself failed
export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
    await transporter.sendMail({
        from: `"BookStore" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: "Reset your BookStore password",
        text: `Hi ${fullName || ""},\n\nWe received a request to reset your password. This link expires in 10 minutes:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <p>Hi ${fullName || "there"},</p>
                <p>We received a request to reset your password. This link expires in <strong>10 minutes</strong>.</p>
                <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset your password</a></p>
                <p style="color:#666;font-size:13px;">Or paste this link into your browser:<br/>${resetUrl}</p>
                <hr />
                <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `
    });
};