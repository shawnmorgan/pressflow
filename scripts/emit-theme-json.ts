/**
 * Scratch script: emit theme.json from DEFAULT_DESIGN_SYSTEM for manual review.
 * Run: npx tsx scripts/emit-theme-json.ts
 */
import { DEFAULT_DESIGN_SYSTEM } from '../lib/design-system'
import { themeJson } from '../lib/block-markup'
import { writeFileSync } from 'fs'

const output = themeJson(DEFAULT_DESIGN_SYSTEM)
writeFileSync('scratch-theme.json', output, 'utf-8')
console.log('Wrote scratch-theme.json')
console.log(output)
