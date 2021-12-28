// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require("nodemailer");

export async function sendEmail(receivers: string[], subject: string, message: string, sender?: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: sender ?? `${process.env.APP_NAME} <${process.env.EMAIL_USER}>`,
        to: receivers.join(", "),
        subject: subject,
        html: message,
    });

    if (process.env.NODE_ENV === "development") {
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
}
