const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL;
  const url = `${baseUrl}/verify-email/${token}`;

  try {
    const data = await resend.emails.send({
      from: 'Book Club <onboarding@resend.dev>',
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

    console.log('Verification email sent:', data);
  } catch (error) {
    console.error('Email send failed.', error);
    throw error;
  }
};

module.exports = sendVerificationEmail;
