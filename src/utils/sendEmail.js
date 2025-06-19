

const nodemailer = require('nodemailer');

const sendEmail = async (mailOptions) => {
  try {
   
    const transporter = nodemailer.createTransport({
      service:"Gmail",
      auth: {
        user: 'rajatbongday2511@gmail.com',          // Your Gmail address
        pass: 'vtpnhuvuoczhvzda',                  // Your Gmail app password
      },
      tls: {
    
    rejectUnauthorized: false
  }
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
