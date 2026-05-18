const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Email transporter verification failed:", error);
    } else {
        console.log("Email transporter is ready to send messages");
    }
});

const sendMail = async (
    to,
    subject,
    text,
    html
) => {
    const from = process.env.EMAIL_FROM
        ? process.env.EMAIL_FROM
        : `"Keyhub Store" <${process.env.EMAIL_USER}>`;

    await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
    });
};

module.exports = sendMail;