import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendContactNotification(data: {
  name: string
  email: string
  phone?: string
  message: string
}) {
  await transporter.sendMail({
    from: `"JC Tire Shop Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `New Contact Form Submission — ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
        <div style="background: #0A0A0A; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #DC2626; margin: 0; font-size: 20px;">JC Tire Shop</h1>
          <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">New Website Contact Form Submission</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #374151; width: 80px; vertical-align: top;">Name</td>
              <td style="padding: 10px 0; color: #111827;">${data.name}</td>
            </tr>
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Email</td>
              <td style="padding: 10px 0;">
                <a href="mailto:${data.email}" style="color: #DC2626;">${data.email}</a>
              </td>
            </tr>
            ${data.phone ? `
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Phone</td>
              <td style="padding: 10px 0;">
                <a href="tel:${data.phone}" style="color: #DC2626;">${data.phone}</a>
              </td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; color: #111827; line-height: 1.6;">
                ${data.message.replace(/\n/g, '<br>')}
              </td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 12px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #DC2626;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
            </p>
          </div>
          <div style="margin-top: 16px; text-align: center;">
            <a href="mailto:${data.email}" style="background: #DC2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">
              Reply to ${data.name}
            </a>
          </div>
        </div>
      </div>
    `,
  })
}
