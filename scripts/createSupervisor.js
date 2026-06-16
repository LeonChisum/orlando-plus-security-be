#!/usr/bin/env node
// Usage: node scripts/createSupervisor.js <email> <password> <firstName> <lastName>
// Example: node scripts/createSupervisor.js admin@ops.com password123 Leon Chisum

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const [, , email, password, firstName, lastName] = process.argv

if (!email || !password || !firstName || !lastName) {
  console.error('Usage: node scripts/createSupervisor.js <email> <password> <firstName> <lastName>')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName, lastName },
  })

  if (error) {
    console.error('Failed to create user:', error.message)
    process.exit(1)
  }

  console.log('Supervisor created:')
  console.log(`  ID:    ${data.user.id}`)
  console.log(`  Name:  ${firstName} ${lastName}`)
  console.log(`  Email: ${data.user.email}`)
}

main()
