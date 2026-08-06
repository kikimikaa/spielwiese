import { networkInterfaces } from 'node:os'
import { pickLanIp } from '../../core/logic'

/**
 * Prints the WLAN URLs on startup so the host immediately knows what to share —
 * the local IPv4 is detected automatically (see the README).
 */
export default defineNitroPlugin(() => {
  const ipv4: string[] = []
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) ipv4.push(net.address)
    }
  }

  const ip = pickLanIp(ipv4)
  const host = ip ?? 'localhost'
  const port = process.env['NITRO_PORT'] || process.env['PORT'] || '3000'
  const base = `http://${host}:${port}`

  const lines = [
    '',
    '  🌱 Spielwiese is running — open these on the same Wi-Fi:',
    `     Board:   ${base}/board`,
    `     Host:    ${base}/host`,
    `     Join:    ${base}/join`,
    `     Invite:  ${base}/invite`,
  ]
  if (!ip) lines.push('     (No LAN IPv4 detected — replace localhost with your machine IP.)')
  lines.push('')

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'))
})
