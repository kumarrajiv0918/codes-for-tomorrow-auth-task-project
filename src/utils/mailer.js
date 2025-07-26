const nodemailer =  require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:  process.env.USER_EMAIL ||  'kumarrajiv0918@gmail.com',
        pass: process.env.USER_PASSWORD || 'tuqv kqbp tlzv fzvo'
    }
});
const sendResetPasswordEmail= async ( to , token)=>{
    const resetLink =`http://localhost:3000/resetPassword/${token}`
    const mailOptions =  {
        from : process.env.USER_EMAIL ||  "kumarrajiv0918@gmail.com",
        to,
        subject: 'password reset request',
        html: 
        `<p> this link will expaire 5 minute </p>
        <a href="${resetLink}"> reset link password</a> `
    }
    await transporter.sendMail(mailOptions)
}
module.exports = sendResetPasswordEmail