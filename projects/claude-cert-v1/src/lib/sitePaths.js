function getBaseUrl() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

export function getRouterBasename() {
  const trimmedBaseUrl = getBaseUrl().replace(/\/$/, '')
  return trimmedBaseUrl || '/'
}

export function getAssetUrl(relativePath = '') {
  const normalizedPath = relativePath.replace(/^\/+/, '')
  return new URL(normalizedPath, window.location.origin + getBaseUrl()).toString()
}
