import { getState, subscribe } from '../utils/state'

// One unsubscribe callback per connected peer, so we can detach on close.
const unsubByPeer = new Map<string, () => void>()

/**
 * Live channel: on connect we push the full state, then every commit is
 * broadcast to all peers. State is small, so sending it whole keeps clients
 * trivially in sync without diffing.
 */
export default defineWebSocketHandler({
  open(peer) {
    peer.send(JSON.stringify({ type: 'state', state: getState() }))
    unsubByPeer.set(
      peer.id,
      subscribe((s) => peer.send(JSON.stringify({ type: 'state', state: s }))),
    )
  },
  close(peer) {
    unsubByPeer.get(peer.id)?.()
    unsubByPeer.delete(peer.id)
  },
})
