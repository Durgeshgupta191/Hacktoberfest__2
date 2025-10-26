import nodemailer from 'nodemailer';

let transporter = null;

// const getTransporter = () => {
//   if (!transporter) {
//     transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }
//   return transporter;
// };

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // `true` for port 465, `false` for other ports like 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // This MUST be your Google App Password
      },
    });
  }
  return transporter;
};

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Email Verification Code',
    html: `
      <h2>Verify Your Email</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `,
  };

  return getTransporter().sendMail(mailOptions);
};

// export const sendOTPEmail = async (email, otp) => {
//   try {
//     const transporter = getTransporter();
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Your OTP',
//       html: `<p>${otp}</p>`,
//     });
//     console.log("Email sent successfully");
//   } catch (err) {
//     console.error("Email send error:", err.message);
//   }
// };

