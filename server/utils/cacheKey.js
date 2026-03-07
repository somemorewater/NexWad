function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${key}:${stableStringify(value[key])}`).join(',')}}`
  }
  return String(value ?? '')
}

function serializeQuery(query = {}) {
  const normalized = {}
  Object.keys(query || {}).sort().forEach((key) => {
    const value = query[key]
    if (value === undefined || value === null || value === '') return
    normalized[key] = value
  })
  return stableStringify(normalized)
}

module.exports = {
  serializeQuery,
}
