const PDFDocument = require('pdfkit')
const { uploadBuffer } = require('./cloudinary')

// ─── NexWAD color palette ─────────────────────
const COLORS = {
  ink:     '#0a0a0f',
  primary: '#2563ff',
  accent:  '#ff5c35',
  gray:    '#6b6962',
  light:   '#f5f4f0',
  border:  '#e4e3db',
  white:   '#ffffff',
}

/**
 * Generate a styled PDF receipt and upload to Cloudinary.
 * Returns { url, publicId }
 */
async function generateReceiptPDF({
  receiptId,
  type,             // 'subscription' | 'purchase'
  recipientName,
  recipientEmail,
  items,            // [{ label, value }]
  total,
  currency = 'NGN',
  date = new Date(),
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const chunks = []
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `NexWAD Receipt — ${receiptId}`,
          Author: 'NexWAD',
          Subject: 'Payment Receipt',
        },
      })

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', async () => {
        const buffer = Buffer.concat(chunks)
        try {
          const result = await uploadBuffer(buffer, 'receipts', {
            public_id: `receipt_${receiptId}`,
            format: 'pdf',
          })
          resolve({ url: result.secure_url, publicId: result.public_id })
        } catch (err) {
          reject(err)
        }
      })

      const W = doc.page.width
      const H = doc.page.height
      const MARGIN = 48

      // ── Header background ─────────────────────
      doc.rect(0, 0, W, 130).fill(COLORS.ink)

      // ── Logo ──────────────────────────────────
      doc.fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(24)
        .text('NexWAD', MARGIN, 44)

      doc.fillColor(COLORS.accent)
        .circle(doc.x + 4, 56, 4)
        .fill()

      doc.fillColor('rgba(255,255,255,0.5)')
        .font('Helvetica')
        .fontSize(10)
        .text('AFIT Kaduna Student Platform', MARGIN, 76)

      // Receipt type badge
      const badgeText = type === 'subscription' ? 'SUBSCRIPTION RECEIPT' : 'PURCHASE RECEIPT'
      doc.fillColor(COLORS.primary)
        .roundedRect(W - MARGIN - 150, 44, 150, 28, 14)
        .fill()
      doc.fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(badgeText, W - MARGIN - 150, 52, { width: 150, align: 'center' })

      // ── Receipt details box ───────────────────
      let y = 160

      doc.fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('Receipt', MARGIN, y)

      y += 36
      doc.fillColor(COLORS.gray)
        .font('Helvetica')
        .fontSize(10)
        .text(`Receipt ID: ${receiptId}`, MARGIN, y)
        .text(`Date: ${date.toLocaleDateString('en-NG', { dateStyle: 'long' })}`, MARGIN, y + 16)

      // ── Recipient section ─────────────────────
      y += 60
      doc.fillColor(COLORS.light)
        .roundedRect(MARGIN, y, W - MARGIN * 2, 64, 8)
        .fill()

      doc.fillColor(COLORS.gray)
        .font('Helvetica')
        .fontSize(9)
        .text('BILLED TO', MARGIN + 16, y + 14, { characterSpacing: 0.5 })

      doc.fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(recipientName, MARGIN + 16, y + 28)

      doc.fillColor(COLORS.gray)
        .font('Helvetica')
        .fontSize(10)
        .text(recipientEmail, MARGIN + 16, y + 44)

      // ── Line items ────────────────────────────
      y += 90

      // Table header
      doc.fillColor(COLORS.primary)
        .rect(MARGIN, y, W - MARGIN * 2, 32)
        .fill()

      doc.fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('DESCRIPTION', MARGIN + 16, y + 10)
        .text('AMOUNT', W - MARGIN - 80, y + 10)

      y += 32

      // Items
      items.forEach((item, i) => {
        const rowY = y + i * 40
        if (i % 2 === 0) {
          doc.fillColor('#fafafa').rect(MARGIN, rowY, W - MARGIN * 2, 40).fill()
        }

        doc.fillColor(COLORS.ink)
          .font('Helvetica')
          .fontSize(11)
          .text(item.label, MARGIN + 16, rowY + 13)
          .text(item.value, W - MARGIN - 80, rowY + 13)

        // Row border
        doc.strokeColor(COLORS.border)
          .lineWidth(0.5)
          .moveTo(MARGIN, rowY + 40)
          .lineTo(W - MARGIN, rowY + 40)
          .stroke()
      })

      y += items.length * 40 + 20

      // ── Total ─────────────────────────────────
      doc.fillColor(COLORS.ink)
        .rect(MARGIN, y, W - MARGIN * 2, 52)
        .fill()

      doc.fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('TOTAL PAID', MARGIN + 16, y + 17)
        .text(`${currency} ${total?.toLocaleString('en-NG')}`, W - MARGIN - 120, y + 17)

      // ── Footer ────────────────────────────────
      const footerY = H - 80
      doc.fillColor(COLORS.border)
        .lineWidth(1)
        .moveTo(MARGIN, footerY)
        .lineTo(W - MARGIN, footerY)
        .stroke()

      doc.fillColor(COLORS.gray)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'NexWAD is an official student platform for AFIT Kaduna. For support, contact support@nexwad.com',
          MARGIN, footerY + 14, { width: W - MARGIN * 2, align: 'center' }
        )
        .text(
          `© ${new Date().getFullYear()} NexWAD. All rights reserved.`,
          MARGIN, footerY + 30, { width: W - MARGIN * 2, align: 'center' }
        )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { generateReceiptPDF }
