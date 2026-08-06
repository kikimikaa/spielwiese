import { getState } from '../utils/state'

// Initial snapshot for first paint / SSR; live updates come via WebSocket.
export default defineEventHandler(() => getState())
