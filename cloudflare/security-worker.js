addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const BLOCK_PATTERNS = [
  /^\/.git(\/.*)?$/,
  /^\/.env$/,
  /^\/backup(\.zip|\.sql)?$/,
  /^\/database\.sql$/,
  /^\/config\.php$/,
  /^\/wp-admin(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/phpmyadmin(\/.*)?$/,
  /^\/phpinfo\.php$/,
  /^\/.htaccess$/,
  /^\/.DS_Store$/,
  /^\/server-status$/
]

function isBlocked(path) {
  return BLOCK_PATTERNS.some(rx => rx.test(path))
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  if (isBlocked(path)) {
    return new Response('Forbidden', { status: 403 })
  }

  const res = await fetch(request)
  const newHeaders = new Headers(res.headers)

  // Security headers
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  newHeaders.set('X-Frame-Options', 'SAMEORIGIN')
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('Referrer-Policy', 'no-referrer-when-downgrade')
  newHeaders.set('Content-Security-Policy', "default-src 'self'")

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders
  })
}
