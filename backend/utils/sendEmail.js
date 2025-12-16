const nodemailer = require('nodemailer');

/**
 * sendEmail - send an email using SMTP (nodemailer) or a safe no-op logger.
 * Accepts either a single mailOptions object, or positional args: (to, subject, text, html, options)
 *
 * Examples:
 *  sendEmail({ to: 'a@b.com', subject: 'Hi', text: '...' })
 *  sendEmail('a@b.com', 'Hi', 'text', '<b>html</b>', { from: 'x@y.com' })
 */

let transporter = null;
let transportInitialized = false;

function initTransporterIfPossible() {
    if (transportInitialized) return;
    transportInitialized = true;

    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_SECURE,
        SMTP_USER,
        SMTP_PASS
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT) {
        // Missing minimal SMTP config; do not initialize transporter
        return;
    }

    const port = parseInt(SMTP_PORT, 10) || undefined;
    const secure = String(SMTP_SECURE || 'false').toLowerCase() === 'true';

    const transportOpts = {
        host: SMTP_HOST,
        port,
        secure
    };

    if (SMTP_USER || SMTP_PASS) {
        transportOpts.auth = {};
        if (SMTP_USER) transportOpts.auth.user = SMTP_USER;
        if (SMTP_PASS) transportOpts.auth.pass = SMTP_PASS;
    }

    try {
        transporter = nodemailer.createTransport(transportOpts);
    } catch (err) {
        transporter = null;
        console.error('sendEmail: failed to create transporter', err);
    }
}

async function trySendWithTransport(mailOptions) {
    if (!transporter) return false;
    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error('sendEmail: error sending mail', err);
        return false;
    }
}

async function noopLogAndResolve(mailOptions) {
    try {
        console.info('sendEmail: no SMTP transporter configured, logging email instead of sending:', {
            from: mailOptions.from,
            to: mailOptions.to,
            cc: mailOptions.cc,
            bcc: mailOptions.bcc,
            subject: mailOptions.subject,
            text: typeof mailOptions.text === 'string' ? mailOptions.text.slice(0, 1000) : undefined,
            html: typeof mailOptions.html === 'string' ? mailOptions.html.slice(0, 1000) : undefined,
            headers: mailOptions.headers
        });
        return true;
    } catch (err) {
        console.error('sendEmail: logging fallback failed', err);
        return false;
    }
}

async function sendEmail(...args) {
    try {
        initTransporterIfPossible();

        let mailOptions = {};
        if (args.length === 1 && typeof args[0] === 'object') {
            // Called with a single mailOptions object
            mailOptions = Object.assign({}, args[0]);
        } else {
            // Positional args: to, subject, text, html, options
            const [to, subject, text, html, options = {}] = args;
            mailOptions = {
                to,
                subject,
                text,
                html,
                ...options
            };
        }

        const DEFAULT_FROM = process.env.DEFAULT_FROM || 'no-reply@localhost';
        if (!mailOptions.from) mailOptions.from = DEFAULT_FROM;

        if (transporter) {
            return await trySendWithTransport(mailOptions);
        } else {
            return await noopLogAndResolve(mailOptions);
        }
    } catch (err) {
        console.error('sendEmail: unexpected error', err);
        return false;
    }
}

module.exports = sendEmail;