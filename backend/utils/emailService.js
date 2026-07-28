import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
});

const sendViaResend = async (to, subject, text) => {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM || "onboarding@resend.dev",
            to: [to],
            subject,
            text,
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`resend api ${res.status}: ${body.slice(0, 300)}`);
    }
};

const sendViaBrevoApi = async (to, subject, text) => {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: { email: process.env.EMAIL_FROM || process.env.EMAIL_USER },
            to: [{ email: to }],
            subject,
            textContent: text,
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`brevo api ${res.status}: ${body.slice(0, 300)}`);
    }
};

export const sendEmail = async (to, subject, text) => {
    try {
        if (process.env.RESEND_API_KEY) {
            await sendViaResend(to, subject, text);
            return;
        }
        if (process.env.BREVO_API_KEY) {
            await sendViaBrevoApi(to, subject, text);
            return;
        }
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
    } catch (err) {
        console.error("[email] send failed:", err.message);
        throw err;
    }
};
