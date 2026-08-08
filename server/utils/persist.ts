import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

/**
 * Builds a coalesced async JSON-file writer. Bursts of mutations collapse into a
 * single pending write instead of blocking the event loop with a sync write each
 * time; `snapshot` is read at write time so the latest value always lands. The
 * directory is created once. The returned function resolves once the write (plus
 * any write re-queued while it ran) has settled, so callers that need durability
 * — e.g. an HTTP handler answering the client — can await it, while fire-and-
 * forget callers can `void` it.
 */
export function createJsonWriter(path: string, snapshot: () => unknown): () => Promise<void> {
  let dirEnsured = false
  let writing = false
  let writeAgain = false
  let pending: Promise<void> = Promise.resolve()

  async function run(): Promise<void> {
    writing = true
    try {
      if (!dirEnsured) {
        await mkdir(dirname(path), { recursive: true })
        dirEnsured = true
      }
      while (writeAgain) {
        writeAgain = false
        await writeFile(path, JSON.stringify(snapshot(), null, 2), 'utf8')
      }
    } finally {
      writing = false
    }
  }

  return function persist(): Promise<void> {
    writeAgain = true
    if (!writing) pending = run()
    return pending
  }
}
