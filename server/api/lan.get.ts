import { lanIp } from '../utils/network'

/**
 * The host's LAN IPv4 so the client can build an invite QR that phones on the
 * same Wi-Fi can actually reach — used when the board is opened via `localhost`.
 */
export default defineEventHandler(() => ({ ip: lanIp() }))
