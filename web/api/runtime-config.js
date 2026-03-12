module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    apiUrl: process.env.VITE_API_URL || '',
  })
}
