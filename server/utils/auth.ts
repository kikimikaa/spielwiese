/** Rejects the request unless the given PIN matches the configured host PIN. */
export function assertHostPin(pin: unknown): void {
  const expected = useRuntimeConfig().hostPin
  if (!pin || String(pin) !== String(expected)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid host PIN' })
  }
}
