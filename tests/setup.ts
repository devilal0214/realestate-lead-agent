// Load .env.local for test environment
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://akebxreiiotapnokwwlk.supabase.co'
