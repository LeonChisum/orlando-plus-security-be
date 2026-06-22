// Run from repo root: node scripts/gen-sample-buyorder.mjs
// Generates client/public/sample-buy-order.xlsx — Europa 2025 dummy data

import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const XLSX = require(`${__dirname}/../client/node_modules/xlsx/xlsx.js`)

const rows = [
  // ── Hall A ────────────────────────────────────────────────────────
  { 'Post Name': 'Main Entrance',        Hall: 'Hall A', Type: 'Security',  Date: '09/05/2025', 'Start Time': '0600', 'End Time': '0000', Headcount: 2, Notes: 'Primary public entry — check badges' },
  { 'Post Name': 'Main Entrance',        Hall: 'Hall A', Type: 'Security',  Date: '09/06/2025', 'Start Time': '0600', 'End Time': '0000', Headcount: 2, Notes: 'Primary public entry — check badges' },
  { 'Post Name': 'Main Entrance',        Hall: 'Hall A', Type: 'Security',  Date: '09/07/2025', 'Start Time': '0600', 'End Time': '2000', Headcount: 2, Notes: '' },
  { 'Post Name': 'Exhibition Floor Roam', Hall: 'Hall A', Type: 'Security', Date: '09/05/2025', 'Start Time': '0800', 'End Time': '2200', Headcount: 3, Notes: 'Roaming patrol, no fixed post' },
  { 'Post Name': 'Exhibition Floor Roam', Hall: 'Hall A', Type: 'Security', Date: '09/06/2025', 'Start Time': '0800', 'End Time': '2200', Headcount: 3, Notes: '' },
  { 'Post Name': 'Exhibition Floor Roam', Hall: 'Hall A', Type: 'Security', Date: '09/07/2025', 'Start Time': '0800', 'End Time': '1800', Headcount: 2, Notes: '' },

  // ── Hall B ────────────────────────────────────────────────────────
  { 'Post Name': 'Main Stage Door',      Hall: 'Hall B', Type: 'Security',  Date: '09/05/2025', 'Start Time': '1200', 'End Time': '2300', Headcount: 1, Notes: 'Artist/talent only beyond this point' },
  { 'Post Name': 'Main Stage Door',      Hall: 'Hall B', Type: 'Security',  Date: '09/06/2025', 'Start Time': '1200', 'End Time': '2300', Headcount: 1, Notes: '' },
  { 'Post Name': 'VIP Lounge Access',    Hall: 'Hall B', Type: 'Security',  Date: '09/05/2025', 'Start Time': '1400', 'End Time': '2300', Headcount: 1, Notes: 'Wristband verification required' },
  { 'Post Name': 'VIP Lounge Access',    Hall: 'Hall B', Type: 'Security',  Date: '09/06/2025', 'Start Time': '1400', 'End Time': '2300', Headcount: 1, Notes: '' },
  { 'Post Name': 'VIP Lounge Access',    Hall: 'Hall B', Type: 'Security',  Date: '09/07/2025', 'Start Time': '1400', 'End Time': '2000', Headcount: 1, Notes: '' },

  // ── Loading Dock ──────────────────────────────────────────────────
  { 'Post Name': 'Dock Access Control',  Hall: 'Loading Dock', Type: 'Security', Date: '09/04/2025', 'Start Time': '0600', 'End Time': '2200', Headcount: 2, Notes: 'Load-in day — vendor vehicles only' },
  { 'Post Name': 'Dock Access Control',  Hall: 'Loading Dock', Type: 'Security', Date: '09/05/2025', 'Start Time': '0500', 'End Time': '1400', Headcount: 1, Notes: '' },
  { 'Post Name': 'Dock Access Control',  Hall: 'Loading Dock', Type: 'Security', Date: '09/07/2025', 'Start Time': '1600', 'End Time': '0000', Headcount: 2, Notes: 'Load-out — coordinate with venue ops' },

  // ── Registration / Main Lobby ─────────────────────────────────────
  { 'Post Name': 'Registration Desk',    Hall: 'Registration', Type: 'Staff',    Date: '09/05/2025', 'Start Time': '0700', 'End Time': '1900', Headcount: 4, Notes: 'Badge distribution and attendee check-in' },
  { 'Post Name': 'Registration Desk',    Hall: 'Registration', Type: 'Staff',    Date: '09/06/2025', 'Start Time': '0700', 'End Time': '1900', Headcount: 4, Notes: '' },
  { 'Post Name': 'Registration Desk',    Hall: 'Registration', Type: 'Staff',    Date: '09/07/2025', 'Start Time': '0700', 'End Time': '1600', Headcount: 3, Notes: '' },
  { 'Post Name': 'Info Desk',            Hall: 'Registration', Type: 'Staff',    Date: '09/05/2025', 'Start Time': '0800', 'End Time': '1800', Headcount: 2, Notes: '' },
  { 'Post Name': 'Info Desk',            Hall: 'Registration', Type: 'Staff',    Date: '09/06/2025', 'Start Time': '0800', 'End Time': '1800', Headcount: 2, Notes: '' },
  { 'Post Name': 'Lobby Roam',           Hall: 'Registration', Type: 'Security', Date: '09/05/2025', 'Start Time': '0800', 'End Time': '2100', Headcount: 1, Notes: '' },
  { 'Post Name': 'Lobby Roam',           Hall: 'Registration', Type: 'Security', Date: '09/06/2025', 'Start Time': '0800', 'End Time': '2100', Headcount: 1, Notes: '' },
  { 'Post Name': 'Lobby Roam',           Hall: 'Registration', Type: 'Security', Date: '09/07/2025', 'Start Time': '0800', 'End Time': '1800', Headcount: 1, Notes: '' },
]

const ws = XLSX.utils.json_to_sheet(rows, {
  header: ['Post Name', 'Hall', 'Type', 'Date', 'Start Time', 'End Time', 'Headcount', 'Notes'],
})

// Column widths
ws['!cols'] = [
  { wch: 26 }, // Post Name
  { wch: 18 }, // Hall
  { wch: 10 }, // Type
  { wch: 12 }, // Date
  { wch: 12 }, // Start Time
  { wch: 10 }, // End Time
  { wch: 10 }, // Headcount
  { wch: 42 }, // Notes
]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Europa 2025')

const outPath = new URL('../client/public/sample-buy-order.xlsx', import.meta.url)
XLSX.writeFile(wb, fileURLToPath(outPath))

console.log('Written →', fileURLToPath(outPath))
console.log(`  ${rows.length} rows across 4 halls`)
