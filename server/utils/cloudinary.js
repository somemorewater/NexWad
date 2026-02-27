const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Storage factories ────────────────────────

function makeStorage(folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'], transformOverride = null) {
  return new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const isVideo = file?.mimetype?.startsWith('video/')
      const baseTransform = isVideo
        ? [{ quality: 'auto', fetch_format: 'auto' }]
        : [
            { quality: 'auto', fetch_format: 'webp', format: 'webp' },
            { width: 1600, height: 1600, crop: 'limit' },
          ]
      return {
        folder: `nexwad/${folder}`,
        allowed_formats: allowedFormats,
        transformation: transformOverride || baseTransform,
      }
    },
  })
}

// ─── Multer upload instances ──────────────────
const uploadListingImages = multer({
  storage: makeStorage('listings'),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
}).array('images', 5)

const uploadAvatar = multer({
  storage: makeStorage('avatars', ['jpg', 'jpeg', 'png', 'webp'], [
    { quality: 'auto', fetch_format: 'webp', format: 'webp' },
    { width: 512, height: 512, crop: 'fill', gravity: 'auto' },
  ]),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('avatar')

const uploadPostImage = multer({
  storage: makeStorage('posts'),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('image')

const uploadLostFoundImage = multer({
  storage: makeStorage('lostfound'),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('image')

const uploadChatMedia = multer({
  storage: makeStorage('chat', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov']),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
}).single('media')

const uploadSellerId = multer({
  storage: makeStorage('seller-id'),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('schoolIdImage')

// ─── Middleware wrapper (handles multer errors) ─
function handleUpload(multerInstance) {
  return (req, res, next) => {
    multerInstance(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` })
      }
      if (err) return res.status(400).json({ error: err.message })
      next()
    })
  }
}

// ─── Delete asset ─────────────────────────────
async function deleteAsset(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.warn('Cloudinary delete failed:', err.message)
  }
}

// ─── Upload from buffer (for PDF receipts) ───
async function uploadBuffer(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `nexwad/${folder}`, resource_type: 'raw', ...options },
      (err, result) => { if (err) reject(err); else resolve(result) }
    )
    stream.end(buffer)
  })
}

module.exports = {
  cloudinary,
  handleUpload,
  uploadListingImages,
  uploadAvatar,
  uploadPostImage,
  uploadLostFoundImage,
  uploadChatMedia,
  uploadSellerId,
  deleteAsset,
  uploadBuffer,
}
