import { config } from 'dotenv'
import { resolve } from 'path'
import { sendDailyDigestEmail } from '../lib/sendDailyDigestEmail'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const r = await sendDailyDigestEmail({ test: true })
  if (!r.ok) {
    console.error('Failed:', 'error' in r ? r.error : r)
    process.exit(1)
  }
  console.log('Test email sent (subject includes [TEST]).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
