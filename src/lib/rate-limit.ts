// Simple in-memory rate limiter (use Upstash Redis for production distributed rate limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number
  max: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowMs
  const max = options.max

  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + windowMs }
    rateLimitMap.set(key, newRecord)
    return { success: true, remaining: max - 1, resetTime: newRecord.resetTime }
  }

  if (record.count >= max) {
    return { success: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  rateLimitMap.set(key, record)
  return { success: true, remaining: max - record.count, resetTime: record.resetTime }
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key)
      }
    })
  }, 5 * 60 * 1000)
}

export const RATE_LIMITS = {
  chat: { windowMs: 60 * 1000, max: 20 },          // 20 messages per minute per session
  api: { windowMs: 60 * 1000, max: 60 },            // 60 API calls per minute per IP
  auth: { windowMs: 15 * 60 * 1000, max: 10 },     // 10 auth attempts per 15 minutes
  upload: { windowMs: 60 * 1000, max: 5 },          // 5 uploads per minute
}
