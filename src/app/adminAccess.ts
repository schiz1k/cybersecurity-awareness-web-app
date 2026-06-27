const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map((item) => Number(item))

  if (octets.length !== 4 || octets.some((item) => Number.isNaN(item))) {
    return false
  }

  if (octets[0] === 10) {
    return true
  }

  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    return true
  }

  return octets[0] === 192 && octets[1] === 168
}

export function isLocalAdminHost(hostname?: string) {
  const currentHostname =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')

  if (!currentHostname) {
    return false
  }

  return localHostnames.has(currentHostname) || isPrivateIpv4(currentHostname)
}
