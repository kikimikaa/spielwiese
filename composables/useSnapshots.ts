import type { SnapshotMeta } from '../core/snapshots'

/**
 * Host-side save/resume: the list of saved snapshots plus the actions to save,
 * load and delete them. Every call returns the fresh list from the server and
 * keeps the shared `snapshots` state in sync.
 */
export function useSnapshots() {
  const { pin } = useHost()
  const snapshots = useState<SnapshotMeta[]>('host-snapshots', () => [])

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await $fetch<{ snapshots: SnapshotMeta[] }>('/api/host/snapshots', {
      method: 'POST',
      body: { pin: pin.value, action, ...extra },
    })
    snapshots.value = res.snapshots
  }

  return {
    snapshots,
    list: () => call('list'),
    save: (name: string) => call('save', { name }),
    load: (id: string) => call('load', { id }),
    remove: (id: string) => call('delete', { id }),
  }
}
