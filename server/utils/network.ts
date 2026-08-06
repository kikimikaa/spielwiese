import { networkInterfaces } from 'node:os'
import { pickLanIp } from '../../core/logic'

/**
 * The machine's most likely home-LAN IPv4, or null if none is detectable.
 * Shared by the startup banner and the /api/lan endpoint so guests always get a
 * reachable address — never `localhost`, which only works on the host machine.
 */
export function lanIp(): string | null {
  const ipv4: string[] = []
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) ipv4.push(net.address)
    }
  }
  return pickLanIp(ipv4)
}
