import { test, expect, Page } from '@playwright/test'

// Unique suffix per run to avoid collisions
const RUN_ID = Date.now()
const TEST_EMAIL = `e2e_${RUN_ID}@test.invalid`
const TEST_PASSWORD = 'E2ePassword123!'
const TEST_WORKSPACE = `E2E Workspace ${RUN_ID}`
const BOT_NAME = `E2E Bot ${RUN_ID}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillAndSubmit(page: Page, fields: Record<string, string>, submitText: string) {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(label, { exact: false })
    await input.fill(value)
  }
  await page.getByRole('button', { name: submitText, exact: false }).click()
}

// ─── Signup Flow ──────────────────────────────────────────────────────────────

test.describe('Signup Flow', () => {
  test('new user can sign up and lands on dashboard', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

    await page.getByLabel(/full name/i).fill('E2E Test User')
    await page.getByLabel(/company|agency/i).fill(TEST_WORKSPACE)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /create account/i }).click()

    await page.waitForURL('**/dashboard**', { timeout: 30000 })
    await expect(page).toHaveURL(/dashboard/)
  })
})

// ─── Login Flow ───────────────────────────────────────────────────────────────

test.describe('Login Flow', () => {
  test('existing user can log in', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/dashboard**', { timeout: 20000 })
    await expect(page).toHaveURL(/dashboard/)
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill('WrongPassword!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should stay on login and show an error
    await expect(page.locator('[role="alert"], .text-destructive, [class*="error"]').first()).toBeVisible({ timeout: 8000 })
  })
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
  })

  test('dashboard page loads with key elements', async ({ page }) => {
    await expect(page.getByText(/chatbot|conversation|lead/i).first()).toBeVisible()
  })

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(page.locator('nav, [data-testid="sidebar"], aside').first()).toBeVisible()
  })
})

// ─── Chatbot Creation ─────────────────────────────────────────────────────────

let createdBotId: string | null = null

test.describe('Chatbot Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
  })

  test('can navigate to chatbots page', async ({ page }) => {
    await page.goto('/dashboard/chatbots')
    await expect(page).toHaveURL(/chatbots/)
  })

  test('can create a new chatbot', async ({ page }) => {
    await page.goto('/dashboard/chatbots')

    // Click new chatbot button
    const newBotBtn = page.getByRole('button', { name: /new chatbot|create|add bot/i }).first()
    await newBotBtn.click()

    // Fill in the form
    const nameInput = page.getByLabel(/name/i).first()
    await nameInput.fill(BOT_NAME)

    const systemPromptInput = page.getByLabel(/system prompt/i)
    await systemPromptInput.fill(
      'You are a helpful real estate assistant. Help visitors find properties matching their needs and budget.'
    )

    const welcomeInput = page.getByLabel(/welcome message/i)
    if (await welcomeInput.isVisible()) {
      await welcomeInput.fill('Hi! How can I help you find your perfect property today?')
    }

    // Submit
    await page.getByRole('button', { name: /create|save|submit/i }).last().click()

    // Verify bot appears in list
    await expect(page.getByText(BOT_NAME)).toBeVisible({ timeout: 10000 })
  })

  test('embed code dialog shows for created bot', async ({ page }) => {
    await page.goto('/dashboard/chatbots')

    // Find the bot card and click embed/code button
    const botCard = page.getByText(BOT_NAME).first()
    if (await botCard.isVisible()) {
      const embedBtn = page
        .locator('[class*="card"]')
        .filter({ hasText: BOT_NAME })
        .getByRole('button', { name: /embed|code|install/i })
        .first()

      if (await embedBtn.isVisible()) {
        await embedBtn.click()
        await expect(page.getByText(/script|embed|copy/i).first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

// ─── Leads Page ───────────────────────────────────────────────────────────────

test.describe('Leads Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
  })

  test('leads page loads', async ({ page }) => {
    await page.goto('/dashboard/leads')
    await expect(page).toHaveURL(/leads/)
    // Table or empty state should be visible
    await expect(
      page.getByText(/lead|no lead|empty/i).first()
    ).toBeVisible({ timeout: 8000 })
  })
})

// ─── Conversations Page ───────────────────────────────────────────────────────

test.describe('Conversations Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
  })

  test('conversations page loads', async ({ page }) => {
    await page.goto('/dashboard/conversations')
    await expect(page).toHaveURL(/conversations/)
  })
})

// ─── Widget Loading ───────────────────────────────────────────────────────────

test.describe('Widget', () => {
  test('widget.js is served', async ({ page }) => {
    const res = await page.request.get('/widget.js')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body.length).toBeGreaterThan(100)
  })

  test('chat API OPTIONS returns CORS headers', async ({ page }) => {
    const res = await page.request.fetch('/api/chat', { method: 'OPTIONS' })
    expect(res.status()).toBe(200)
    const headers = res.headers()
    expect(headers['access-control-allow-origin']).toBe('*')
  })
})

// ─── Auth Redirect Guards ─────────────────────────────────────────────────────

test.describe('Auth Guards', () => {
  test('unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    // Clear cookies/storage
    await page.context().clearCookies()
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 10000 })
    await expect(page).toHaveURL(/login/)
  })

  test('authenticated user accessing /login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })

    // Now try to go to /login again — should redirect back to dashboard
    await page.goto('/login')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await expect(page).toHaveURL(/dashboard/)
  })
})

export { createdBotId }
