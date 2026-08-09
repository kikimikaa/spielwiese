import { test, expect, type APIRequestContext } from '@playwright/test'

const PIN = '1909'

// Reset to a known state via the host command bus, then load games and draw
// teams — the tedious setup, so each test starts from the same clean tournament.
async function seed(request: APIRequestContext) {
  const cmd = (command: string, payload: Record<string, unknown> = {}) =>
    request.post('/api/host/command', { data: { pin: PIN, command, payload } })
  await cmd('reset')
  await cmd('loadExampleGames')
  await cmd('draw', { names: ['Ann', 'Bo', 'Cy', 'Di'] })
}

test.beforeEach(async ({ request }) => {
  await seed(request)
})

test('core flow: unlock, play a game, award a point, crown a winner', async ({ page }) => {
  // The board starts with a scoreboard and no winner.
  await page.goto('/board')
  await expect(page.getByTestId('scoreboard')).toBeVisible()
  await expect(page.getByTestId('winner')).toHaveCount(0)

  // Unlock the host area with the PIN.
  await page.goto('/host')
  await page.getByTestId('pin-input').fill(PIN)
  await page.getByTestId('pin-input').press('Enter')
  await expect(page.getByTestId('pin-form')).toHaveCount(0)

  // Start the first game and award the first team a point.
  await page.getByTestId('set-current').first().click()
  await expect(page.getByTestId('game-control')).toBeVisible()
  await page.getByTestId('award-win').first().click()

  // The board reflects the point: exactly one team's score reads 1 (the score
  // carries an aria-label like "Team Welle: 1").
  await page.goto('/board')
  await expect(page.getByLabel(/: 1$/)).toHaveCount(1)

  // Run the ceremony and crown the winner.
  await page.goto('/host')
  await page.getByTestId('show-awards').click()
  await page.getByTestId('start-ceremony').click()
  await page.goto('/board')
  await expect(page.getByTestId('winner')).toBeVisible()
})
