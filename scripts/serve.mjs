// Resilient production launcher for the event: runs the built server and
// restarts it automatically if it ever exits, so the party is never left
// without a scoreboard. State survives via data/state.json. Stop with Ctrl+C.
import { spawn } from 'node:child_process'

const SERVER_ENTRY = '.output/server/index.mjs'
const RESTART_DELAY_MS = 1000

let stopping = false

function start() {
  const child = spawn(process.execPath, [SERVER_ENTRY], { stdio: 'inherit', env: process.env })
  child.on('exit', (code) => {
    if (stopping) return
    console.error(`\n[serve] server exited (code ${code ?? 'null'}) — restarting …`)
    setTimeout(start, RESTART_DELAY_MS)
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true
    process.exit(0)
  })
}

start()
