import {
  newSection,
  opaqueSection,
  type Section,
  type SectionType,
} from '@/lib/sitemap'

type Recognition = { type: SectionType; confidence: 'high' | 'low' }

/** Guess a section type from an element's tag, classes, and contents. */
function recognize(el: Element): Recognition | null {
  const tag = el.tagName.toLowerCase()
  const hint = `${el.className} ${el.id} ${el.getAttribute('role') ?? ''}`.toLowerCase()
  const has = (...words: string[]) => words.some((w) => hint.includes(w))

  if (tag === 'nav' || tag === 'header' || has('navbar', 'navigation', 'menu'))
    return { type: 'Navbar', confidence: 'high' }
  if (tag === 'footer' || has('footer', 'colophon'))
    return { type: 'Footer', confidence: 'high' }
  if (has('hero', 'masthead', 'banner') || el.querySelector('h1'))
    return { type: 'Hero', confidence: has('hero', 'masthead') ? 'high' : 'low' }
  if (has('pricing', 'price', 'plans')) return { type: 'Pricing', confidence: 'high' }
  if (has('faq', 'accordion', 'questions')) return { type: 'FAQ', confidence: 'high' }
  if (has('testimonial', 'review', 'quote')) return { type: 'Testimonial', confidence: 'high' }
  if (has('logo', 'brands', 'clients')) return { type: 'Feature', confidence: 'high' }
  if (has('cta', 'call-to-action', 'callout')) return { type: 'CTA', confidence: 'high' }
  if (has('feature', 'benefits', 'cards', 'grid'))
    return { type: 'Feature', confidence: 'high' }
  if (has('media', 'split', 'two-column')) return { type: 'TextMedia', confidence: 'low' }
  return null
}

function text(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Apply recognized text content onto a freshly templated section. */
function fillFromElement(section: Section, el: Element): Section {
  const e = { ...section.elements }
  const h = el.querySelector('h1, h2, h3')
  const p = el.querySelector('p')
  const btn = el.querySelector('a, button')
  if (h && e.heading.on) e.heading = { on: true, text: text(h) || e.heading.text }
  if (p && e.body.on) e.body = { on: true, text: text(p) || e.body.text }
  if (btn && e.buttons.length)
    e.buttons = [{ ...e.buttons[0], text: text(btn) || e.buttons[0].text }, ...e.buttons.slice(1)]
  return { ...section, elements: e }
}

/**
 * Parse a chunk of HTML into the section model. Recognized blocks map to known
 * section types (and pull in their text); everything else is preserved as an
 * opaque section so nothing is silently dropped.
 */
export function parseHtmlToSections(html: string): {
  sections: Section[]
  recognized: number
  opaque: number
} {
  if (typeof window === 'undefined' || !html.trim())
    return { sections: [], recognized: 0, opaque: 0 }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const roots = Array.from(doc.body.children)
  // If the markup is a single wrapper, descend into it.
  const nodes =
    roots.length === 1 && roots[0].children.length > 1
      ? Array.from(roots[0].children)
      : roots

  const sections: Section[] = []
  let recognized = 0
  let opaque = 0

  for (const el of nodes) {
    const guess = recognize(el)
    if (guess) {
      recognized += 1
      sections.push(fillFromElement(newSection(guess.type, 'imported'), el))
    } else {
      opaque += 1
      const label = el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(' ')[0]}` : '')
      sections.push(opaqueSection(label, el.outerHTML))
    }
  }

  return { sections, recognized, opaque }
}
