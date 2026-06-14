/**
 * Scratch script: emit Ollie-conformant style variation + block styles
 * from DEFAULT_DESIGN_SYSTEM for manual testing in a real Ollie site.
 *
 * Run: npx tsx scripts/emit-ollie.ts
 *
 * Output tree:
 *   scratch/ollie-emit/
 *     styles/pressflow.json
 *     styles/blocks/button/<name>.json
 *     styles/blocks/group/<name>.json
 */
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_DESIGN_SYSTEM } from '../lib/design-system'
import {
  ollieStyleVariation,
  buttonBlockStyle,
  sectionBlockStyle,
} from '../lib/ollie-emit'

const ROOT = join(__dirname, '..', 'scratch', 'ollie-emit')

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true })
}

// 1. Style variation
const stylesDir = join(ROOT, 'styles')
ensureDir(stylesDir)
const variation = ollieStyleVariation(DEFAULT_DESIGN_SYSTEM)
writeFileSync(join(stylesDir, 'pressflow.json'), variation, 'utf-8')

// 2. Button block styles
const buttonDir = join(stylesDir, 'blocks', 'button')
ensureDir(buttonDir)
for (const bv of DEFAULT_DESIGN_SYSTEM.buttonVariations) {
  const { filename, json } = buttonBlockStyle(bv, DEFAULT_DESIGN_SYSTEM)
  writeFileSync(join(buttonDir, filename), json, 'utf-8')
}

// 3. Section (group) block styles
const groupDir = join(stylesDir, 'blocks', 'group')
ensureDir(groupDir)
for (const ss of DEFAULT_DESIGN_SYSTEM.sectionStyles) {
  const { filename, json } = sectionBlockStyle(ss, DEFAULT_DESIGN_SYSTEM)
  writeFileSync(join(groupDir, filename), json, 'utf-8')
}

// Print tree
console.log('\nOllie emit tree:')
console.log('scratch/ollie-emit/')
console.log('  styles/')
console.log('    pressflow.json')
console.log('  styles/blocks/button/')
for (const bv of DEFAULT_DESIGN_SYSTEM.buttonVariations) {
  const { filename } = buttonBlockStyle(bv, DEFAULT_DESIGN_SYSTEM)
  console.log(`    ${filename}`)
}
console.log('  styles/blocks/group/')
for (const ss of DEFAULT_DESIGN_SYSTEM.sectionStyles) {
  const { filename } = sectionBlockStyle(ss, DEFAULT_DESIGN_SYSTEM)
  console.log(`    ${filename}`)
}

// Print the full variation for review
console.log('\n--- pressflow.json (style variation) ---')
console.log(variation)
