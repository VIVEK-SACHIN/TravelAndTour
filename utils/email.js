const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create a transporter

  //we are not using gmail here beacuse it is not at all a good idea for a production grade application
  // as can only send 500 emails per day and quickly be marked as a spammer
  // sendgrid and mailgun are some of the popular mailing services
  // const transporter = nodemailer.createTransport({
  //     service:'Gmail',
  //     auth:{
  //         user://in the env file
  //         password:
  //     }
  // });Activate in gmail less secure app options

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME, //in the env file
      pass: process.env.EMAIL_PASSWORD
    }
  });

  //here we are gonna use speciall development service which basically fakes to send emails to
  // real addresses .but in reality they endup trapped in a development inbox so
  // that we can taake a look and how thay will took later in production mailtrap

  // 2) Define the email options
  const mailOptions = {
    from: 'Vivek GENIUS <hello@vivek.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) Actually send the mail
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
