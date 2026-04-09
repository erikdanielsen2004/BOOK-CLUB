const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL;
  const url = `${baseUrl}/reset-password/${token}`;

  try {
    await resend.emails.send({
      from: 'Book Club <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Password',
      text: `Reset your password (expires in 15 minutes): ${url}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Hello from the Book Club!</h2>
          <p>Please click the button below to reset your password. It will expire in 15 minutes.</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer" 
          style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${url}</p>
        </div>
      `,
    });

    console.log('Reset email sent to:', email);
  } catch (error) {
    console.error('Email send failed.', error);
    throw error;
  }
};

module.exports = sendResetEmail;