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
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // `true` for port 465, `false` for other ports like 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, 
      },
    });
  }
  return transporter;
};

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: 'Your Email Verification Code',
    text: `
      Verify Your Email
      Your OTP is: <>${otp}
      This code expires in 10 minutes.
    `,
  };

  return getTransporter().sendMail(mailOptions);
};


