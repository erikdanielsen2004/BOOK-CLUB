
import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });


  const baseUrl = process.env.FRONTEND_URL || 'https://mernbookclub.xyz';
  const url = `${baseUrl}/verify-email/${token}`;

  await transporter.sendMail({
    from: '"Book Club" <noreply@bookclub.com>',
    to: email,
    subject: 'Confirm your Book Club Membership',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to the Book Club!</h2>
        <p>You're almost there. Please click the button below to verify your email address:</p>
        <a href="${url}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
        <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${url}</p>
      </div>
    `,
  });
};
