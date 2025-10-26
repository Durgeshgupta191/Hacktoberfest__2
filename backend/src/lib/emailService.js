import nodemailer from 'nodemailer';
// import {Resend} from 'resend'

// const resend = new Resend(process.env.RESEND_API_KEY)

// export const sendOTPEmail = async(email,otp) =>{
//   try{
//     const {data,error} = await resend.emails.send({
//       from: 'Acme <onboarding@resend.dev>',
//       to: email,
//       subject: 'Your Email Verification Code',
//       html: `
//         <h2>Verify Your Email</h2>
//         <p>Your OTP is: <strong>${otp}</strong></p>
//         <p>This code expires in 10 minutes.</p>
//       `,
//     })
//   }
//   catch(error){
//     console.log(error);
//   }
  
// }

let transporter = null;

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


