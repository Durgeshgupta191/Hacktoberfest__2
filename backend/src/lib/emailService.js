// import nodemailer from 'nodemailer';


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

// 




// Import the Brevo library at the top of your file
import Brevo from '@getbrevo/brevo'
// This function now uses the Brevo API
export const sendOTPEmail = async (email, otp) => {
  // Configure the API client
  const defaultClient = Brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new Brevo.TransactionalEmailsApi();
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  // Construct the email
  sendSmtpEmail.subject = "Your Email Verification Code";
  sendSmtpEmail.htmlContent = `
    <h2>Verify Your Email</h2>
    <p>Your OTP is: <strong>${otp}</strong></p>
    <p>This code expires in 10 minutes.</p>
  `;
  sendSmtpEmail.sender = { 
    name: "Chatty", 
    email: process.env.SENDER_EMAIL // This MUST be a verified sender in Brevo
  };
  sendSmtpEmail.to = [{ email: email }];

  try {
    // Send the email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully via Brevo API!");
  } catch (error) {
    console.error("Failed to send email via Brevo API:", error.response ? error.response.body : error.message);
    throw new Error("Email could not be sent.");
  }
};