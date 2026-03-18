const nodemailer = require('nodemailer')
const path = require('path')
const logger = require('../utils/logger')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify connection on startup
transporter.verify().then(() => logger.info('SMTP ready')).catch(err => logger.warn('SMTP not ready:', err.message))

// ─── Shared HTML wrapper ─────────────────────
const wrapEmail = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>NexWAD</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',Arial,sans-serif; background:#f5f4f0; color:#0a0a0f; }
  .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 4px 32px rgba(10,10,15,0.08); }
  .header { background:#0a0a0f; padding:24px 40px; display:flex; align-items:center; gap:12px; }
  .logo-img { height:36px; width:auto; display:block; }
  .logo { font-family:'Syne',sans-serif; font-weight:800; font-size:22px; color:#fff; letter-spacing:-0.02em; }
  .logo-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#ff5c35; margin-left:3px; }
  .body { padding:40px; }
  .footer { background:#f5f4f0; padding:24px 40px; text-align:center; font-size:13px; color:#9b9990; border-top:1px solid #e4e3db; }
  .footer a { color:#2563ff; text-decoration:none; }
  h1 { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.015em; margin-bottom:12px; }
  p { font-size:15px; line-height:1.65; color:#4b4945; margin-bottom:16px; }
  .btn { display:inline-block; padding:14px 28px; background:#2563ff; color:#fff; border-radius:999px; font-weight:700; font-size:15px; text-decoration:none; margin:16px 0; }
  .otp { font-family:monospace; font-size:40px; font-weight:800; letter-spacing:0.15em; color:#0a0a0f; background:#f5f4f0; border-radius:12px; padding:20px 32px; text-align:center; margin:24px 0; }
  .divider { height:1px; background:#e4e3db; margin:24px 0; }
  .highlight { background:#dce8ff; color:#1a4ae8; padding:16px 20px; border-radius:10px; margin:16px 0; font-size:14px; }
  .receipt-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0efe9; font-size:14px; }
  .receipt-row:last-child { border-bottom:none; font-weight:700; font-size:15px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img
      class="logo-img"
      src="${process.env.CLIENT_URL || ''}/nexwad-logo-full.png"
      alt="NexWAD"
    />
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} NexWAD · AFIT Kaduna Student Platform</p>
    <p><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> · <a href="#">Support</a></p>
    <p style="margin-top:8px;font-size:12px;color:#cbc9be;">You're receiving this because you have a NexWAD account.</p>
  </div>
</div>
</body>
</html>
`

// ─── Email Templates ─────────────────────────

const templates = {
  otp: ({ name, otp, expiryMinutes = 10 }) => ({
    subject: `${otp} is your NexWAD verification code`,
    html: wrapEmail(`
      <h1>Verify your email</h1>
      <p>Hi ${name},</p>
      <p>Use the code below to verify your NexWAD account. It expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <div class="otp">${otp}</div>
      <p>If you didn't create a NexWAD account, you can safely ignore this email.</p>
      <div class="highlight">⚡ Never share this code with anyone — NexWAD staff will never ask for it.</div>
    `),
  }),

  welcome: ({ name }) => ({
    subject: `Welcome to NexWAD, ${name}! 🎉`,
    html: wrapEmail(`
      <h1>You're in! 🎉</h1>
      <p>Hi ${name},</p>
      <p>Your NexWAD account is ready. You can now buy & sell, find lost items, chat with fellow students, and share campus moments — all in one place.</p>
      <a class="btn" href="${process.env.CLIENT_URL}/dashboard">Go to Dashboard →</a>
      <div class="divider"></div>
      <p style="font-size:13px;color:#9b9990;">Questions? Reply to this email and we'll help you out.</p>
    `),
  }),

  subscriptionConfirmation: ({ name, plan, price, expiresAt, receiptId }) => ({
    subject: `NexWAD ${plan} subscription confirmed ✓`,
    html: wrapEmail(`
      <h1>Subscription confirmed</h1>
      <p>Hi ${name}, your <strong>${plan}</strong> subscription is now active.</p>
      <div class="highlight">Your premium listings are now boosted across the marketplace.</div>
      <div class="divider"></div>
      <div class="receipt-row"><span>Plan</span><span>${plan}</span></div>
      <div class="receipt-row"><span>Amount paid</span><span>₦${price?.toLocaleString()}</span></div>
      <div class="receipt-row"><span>Renews on</span><span>${new Date(expiresAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</span></div>
      <div class="receipt-row"><span>Receipt ID</span><span>${receiptId}</span></div>
      <div class="divider"></div>
      <a class="btn" href="${process.env.CLIENT_URL}/profile/subscription">Manage Subscription →</a>
    `),
  }),

  subscriptionExpiring: ({ name, plan, expiresAt, daysLeft }) => ({
    subject: `Your NexWAD subscription expires in ${daysLeft} days`,
    html: wrapEmail(`
      <h1>Subscription expiring soon</h1>
      <p>Hi ${name}, your <strong>${plan}</strong> subscription expires in <strong>${daysLeft} days</strong>.</p>
      <div class="highlight">Renew now to keep your premium benefits and listings active.</div>
      <div class="receipt-row"><span>Plan</span><span>${plan}</span></div>
      <div class="receipt-row"><span>Expires on</span><span>${new Date(expiresAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</span></div>
      <div class="divider"></div>
      <a class="btn" href="${process.env.CLIENT_URL}/profile/subscription">Renew Subscription →</a>
    `),
  }),

  subscriptionExpired: ({ name, plan, expiresAt }) => ({
    subject: 'Your NexWAD subscription has expired',
    html: wrapEmail(`
      <h1>Subscription expired</h1>
      <p>Hi ${name}, your <strong>${plan}</strong> subscription expired on <strong>${new Date(expiresAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</strong>.</p>
      <div class="highlight">Renew now to restore your premium benefits and listing visibility.</div>
      <div class="divider"></div>
      <a class="btn" href="${process.env.CLIENT_URL}/profile/subscription">Renew Subscription →</a>
    `),
  }),

  sellerApplicationApproved: ({ name, plan, expiresAt }) => ({
    subject: 'Your NexWAD seller application has been approved ✓',
    html: wrapEmail(`
      <h1>Seller application approved</h1>
      <p>Hi ${name},</p>
      <p>Great news. Your seller application has been approved and your seller account is now active.</p>
      <div class="receipt-row"><span>Seller Plan</span><span>${plan}</span></div>
      <div class="receipt-row"><span>Valid until</span><span>${new Date(expiresAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</span></div>
      <div class="divider"></div>
      <a class="btn" href="${process.env.CLIENT_URL}/dashboard">Open Seller Dashboard →</a>
      <p style="font-size:13px;color:#9b9990;">You can now create listings and manage your seller tools on NexWAD.</p>
    `),
  }),

  purchaseReceipt: ({ buyerName, sellerName, listing, amount, transactionId }) => ({
    subject: `Receipt for your NexWAD purchase — ${listing.title}`,
    html: wrapEmail(`
      <h1>Purchase Receipt</h1>
      <p>Hi ${buyerName}, here's your receipt for your recent NexWAD purchase.</p>
      <div class="divider"></div>
      <div class="receipt-row"><span>Item</span><span>${listing.title}</span></div>
      <div class="receipt-row"><span>Seller</span><span>${sellerName}</span></div>
      <div class="receipt-row"><span>Category</span><span>${listing.category}</span></div>
      <div class="receipt-row"><span>Transaction ID</span><span>${transactionId}</span></div>
      <div class="receipt-row"><span>Date</span><span>${new Date().toLocaleDateString('en-NG', { dateStyle: 'long' })}</span></div>
      <div class="receipt-row"><span><strong>Total Paid</strong></span><span><strong>₦${amount?.toLocaleString()}</strong></span></div>
      <div class="divider"></div>
      <p style="font-size:13px;color:#9b9990;">For disputes, contact NexWAD support within 48 hours with your transaction ID.</p>
    `),
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Reset your NexWAD password',
    html: wrapEmail(`
      <h1>Reset your password</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset your NexWAD password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
      <a class="btn" href="${resetUrl}">Reset Password →</a>
      <div class="divider"></div>
      <p style="font-size:13px;color:#9b9990;">If you didn't request a password reset, you can safely ignore this email.</p>
    `),
  }),
}

// ─── Send helper ─────────────────────────────

async function sendEmail(to, templateName, data) {
  try {
    const template = templates[templateName]
    if (!template) throw new Error(`Unknown email template: ${templateName}`)
    const { subject, html } = template(data)
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
    logger.info(`Email sent [${templateName}] to ${to}`)
  } catch (err) {
    logger.error(`Failed to send email [${templateName}] to ${to}:`, err.message)
    // Non-fatal — don't throw, just log
  }
}

module.exports = { sendEmail, transporter }
