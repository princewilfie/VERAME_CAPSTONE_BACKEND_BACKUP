const nodemailer = require('nodemailer');
const config = require('config.json');


module.exports = sendEmail;


async function sendEmail({ to, subject, html, from = config.emailFrom, attachment = null }) {
    const transporter = nodemailer.createTransport(config.smtpOptions);
    
    // Create the mailOptions object
    const mailOptions = {
        from,
        to,
        subject,
        html
    };

    // Add attachment if provided
    if (attachment) {
        mailOptions.attachments = [attachment];
    }

    // Send the email
    await transporter.sendMail(mailOptions);
}