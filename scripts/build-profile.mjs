// Builds the static profile sections in assets/: hero, link pills, services, stack and contact.
// Copy lives in data/profile.json, logos in data/stack-icons.json. Node 20+, no dependencies.
// The project graph is built separately by build-graph.mjs because it reads the live CMS.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { T, W, svg, panel, codeHeading, d, esc, monoWidth, wrapMono } from './lib/svg.mjs'

const read = async (f) => JSON.parse(await readFile(new URL(`../data/${f}`, import.meta.url), 'utf8'))
const P = await read('profile.json')
const ICONS = await read('stack-icons.json')

const X = 40 // left gutter, matching the portfolio's 40px card padding
const INNER = W - X * 2

const spans = (parts, mintClass = '') =>
  parts.map((p) => (p.mint ? `<tspan class="${mintClass}" fill="${T.mint}">${esc(p.text)}</tspan>` : esc(p.text))).join('')

// ---------- hero ----------
function hero() {
  const H = 372
  const eyebrow = P.eyebrow.toUpperCase()
  const ew = monoWidth(eyebrow, 12)
  const n = [...eyebrow].length
  const typeStart = 0.45
  const typeDur = n * 0.032
  const introLines = wrapMono(P.intro, 13.5, INNER)
  const pillW = 46 + monoWidth(P.availability, 12.5) + 18
  const pillY = 304

  const css = `
.type{animation:type ${typeDur.toFixed(2)}s steps(${n}) ${typeStart}s both}
.cover{animation:vanish 0s linear ${(typeStart + typeDur).toFixed(2)}s forwards}
.caret{animation:blink 1s steps(1) ${(typeStart + typeDur).toFixed(2)}s infinite}
.glow{animation:glow .9s ease-out 1.5s both}
@keyframes type{to{transform:translateX(${ew}px)}}
@keyframes vanish{to{opacity:0}}
@keyframes glow{from{fill:${T.heading}}}`

  const body = `${panel(H)}
<text class="sans rise" style="${d(0.05)}" x="${X}" y="54" font-size="20" fill="${T.heading}">${esc(P.name)}</text>
<g class="fade" style="${d(0.3)}"><circle cx="${W - X - monoWidth(P.location.toUpperCase(), 12) - 14}" cy="50" r="3.5" fill="${T.mint}"/><circle class="pulse" cx="${W - X - monoWidth(P.location.toUpperCase(), 12) - 14}" cy="50" r="3.5" fill="none" stroke="${T.mint}"/></g>
<text class="mono fade" style="${d(0.3)}" x="${W - X}" y="54" font-size="12" fill="${T.textMuted}" text-anchor="end">${esc(P.location.toUpperCase())}</text>
<text class="mono" x="${X}" y="84" font-size="12" fill="${T.mint}" letter-spacing="0">${esc(eyebrow)}</text>
<g class="type"><rect class="cover" x="${X}" y="70" width="${ew + 2}" height="20" fill="${T.page}"/><rect class="caret" x="${X + 1}" y="73" width="7" height="14" fill="${T.mint}"/></g>
<line class="draw" style="${d(0.2)}" x1="${X}" y1="108" x2="${W - X}" y2="108" stroke="${T.border}"/>
${P.headline.map((line, i) => `<text class="sans rise" style="${d(0.55 + i * 0.22)}" x="${X}" y="${166 + i * 52}" font-size="42" fill="${T.heading}">${spans(line, 'glow')}</text>`).join('\n')}
${introLines.map((l, i) => `<text class="mono fade" style="${d(1.0 + i * 0.12)}" x="${X}" y="${262 + i * 21}" font-size="13.5" fill="${T.textMuted}">${esc(l)}</text>`).join('\n')}
<g class="rise" style="${d(1.35)}">
<rect x="${X}" y="${pillY}" width="${pillW}" height="36" rx="18" fill="${T.muted}" stroke="${T.border}"/>
<circle cx="${X + 22}" cy="${pillY + 18}" r="4" fill="${T.mint}"/><circle class="pulse" style="${d(1.8)}" cx="${X + 22}" cy="${pillY + 18}" r="4" fill="none" stroke="${T.mint}"/>
<text class="mono" x="${X + 38}" y="${pillY + 22.5}" font-size="12.5" fill="${T.text}">${esc(P.availability)}</text>
</g>`
  return svg({ height: H, label: `${P.name}: ${P.eyebrow}. ${P.headline.flat().map((p) => p.text).join(' ')} ${P.intro}`, body, css })
}

// ---------- link pills (one image per link so each is clickable) ----------
function pill(link, i, delayBase) {
  const label = link.primary ? `${link.label}  →` : link.label
  const tw = label.length * 8.6 // Plex Sans at 15px averages under 8.6px per character
  const w = Math.round(tw + 48)
  const h = 48
  const fill = link.primary ? T.mint : T.card
  const color = link.primary ? T.page : T.text
  const stroke = link.primary ? T.mint : T.border
  const body = `<g class="rise" style="${d(delayBase + i * 0.12)}">
<rect x="1" y="2" width="${w - 2}" height="${h - 4}" rx="${(h - 4) / 2}" fill="${fill}" stroke="${stroke}"/>
<text class="sans" x="${w / 2}" y="${h / 2 + 5}" font-size="15" fill="${color}" text-anchor="middle">${esc(label)}</text>
</g>`
  return svg({ width: w, height: h, label: link.label, fonts: { sans: true, mono: false }, body })
}

// ---------- services ----------
function services() {
  const gap = 16
  const cw = (INNER - gap * 2) / 3
  const ch = 236
  const top = 104
  const H = top + ch + 36
  const cards = P.services
    .map((s, i) => {
      const x = X + i * (cw + gap)
      const desc = wrapMono(s.description, 12, cw - 40)
      const tag = s.tag.toUpperCase()
      const tagW = monoWidth(tag, 10.5) + 20
      const delay = 0.35 + i * 0.15
      return `<g transform="translate(${x} ${top})"><g class="rise" style="${d(delay)}">
<rect width="${cw}" height="${ch}" rx="12" fill="${T.card}"/>
<path class="draw" style="${d(delay + 0.3)}" d="M14 1 H${cw - 14}" stroke="${T.mint}" stroke-width="2" fill="none" stroke-linecap="round"/>
<text class="mono" x="20" y="38" font-size="13" fill="${T.mint}">${s.number}</text>
<rect x="${cw - 20 - tagW}" y="22" width="${tagW}" height="22" rx="11" fill="none" stroke="${T.border}"/>
<text class="mono" x="${cw - 20 - tagW / 2}" y="37" font-size="10.5" fill="${T.textMuted}" text-anchor="middle">${esc(tag)}</text>
${s.title.map((line, j) => `<text class="sans" x="20" y="${80 + j * 25}" font-size="19" fill="${T.heading}">${spans(line)}</text>`).join('\n')}
${desc.map((l, j) => `<text class="mono fade" style="${d(delay + 0.35 + j * 0.06)}" x="20" y="${140 + j * 19}" font-size="12" fill="${T.textMuted}">${esc(l)}</text>`).join('\n')}
</g></g>`
    })
    .join('\n')
  const body = `${panel(H)}
${codeHeading('What I Build', X, 70)}
<text class="mono fade" style="${d(0.5)}" x="${W - X}" y="70" font-size="12" fill="${T.textMuted}" text-anchor="end">design → deployment</text>
${cards}`
  return svg({ height: H, label: `What I build: ${P.services.map((s) => s.title.flat().map((p) => p.text).join('')).join('; ')}`, body })
}

// ---------- stack ----------
function stack() {
  const top = 100
  const gap = 12
  const n = ICONS.length
  const tw = (INNER - gap * (n - 1)) / n
  const th = 100
  const icon = 34
  const lightCss = ICONS.map((ic, i) => `.l${i}{animation:light${i} .7s ease-out ${(0.9 + i * 0.1).toFixed(2)}s both}@keyframes light${i}{from{fill:#5a5a5a}}`).join('')
  const tiles = ICONS.map((ic, i) => {
    const x = X + i * (tw + gap)
    return `<g transform="translate(${x} ${top})"><g class="pop" style="${d(0.3 + i * 0.07)}">
<rect width="${tw}" height="${th}" rx="12" fill="${T.card}"/>
<g transform="translate(${(tw - icon) / 2} 18) scale(${icon / 24})"><path class="l${i}" d="${ic.path}" fill="${ic.color}"/></g>
<text class="mono" x="${tw / 2}" y="${th - 16}" font-size="10.5" fill="${T.textMuted}" text-anchor="middle">${esc(ic.name)}</text>
</g></g>`
  }).join('\n')

  // tool pills, wrapped to the panel width
  const ph = 30
  const pgap = 8
  let px = X
  let py = top + th + 24
  const pills = P.tools.map((t, i) => {
    const w = monoWidth(t, 12) + 26
    if (px + w > W - X) {
      px = X
      py += ph + pgap
    }
    const out = `<g class="fade" style="${d(1.3 + i * 0.045)}"><rect x="${px}" y="${py}" width="${w}" height="${ph}" rx="${ph / 2}" fill="${T.muted}" stroke="${T.border}"/><text class="mono" x="${px + w / 2}" y="${py + 19.5}" font-size="12" fill="${T.text}" text-anchor="middle">${esc(t)}</text></g>`
    px += w + pgap
    return out
  }).join('\n')
  const H = py + ph + 36

  const body = `${panel(H)}
${codeHeading('Stack', X, 70)}
<text class="mono fade" style="${d(0.5)}" x="${W - X}" y="70" font-size="12" fill="${T.textMuted}" text-anchor="end">one developer, the whole build</text>
${tiles}
${pills}`
  return svg({ height: H, label: `Stack: ${ICONS.map((i) => i.name).join(', ')}, ${P.tools.join(', ')}`, body, css: lightCss })
}

// ---------- contact ----------
function contact() {
  const H = 216
  const words = P.contact.title.split(' ')
  const last = words.pop()
  const intro = wrapMono(P.contact.intro, 13.5, 560)
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${T.paper}" stroke="#cfe8d3"/>
<text class="sans fade" style="${d(0.2)}" x="${W - 36}" y="${H - 34}" font-size="150" fill="${T.paperAccent}" opacity=".09" text-anchor="end">&lt;/&gt;</text>
<text class="mono fade" style="${d(0.1)}" x="${X}" y="58" font-size="12" fill="${T.paperAccent}">LET'S TALK</text>
<text class="sans rise" style="${d(0.25)}" x="${X}" y="108" font-size="38" fill="${T.page}">${esc(words.join(' '))} <tspan fill="${T.paperAccent}">${esc(last)}</tspan></text>
${intro.map((l, i) => `<text class="mono fade" style="${d(0.55 + i * 0.12)}" x="${X}" y="${146 + i * 21}" font-size="13.5" fill="#33413a">${esc(l)}</text>`).join('\n')}`
  return svg({ height: H, label: `${P.contact.title} ${P.contact.intro}`, body })
}

const out = (f) => new URL(`../assets/${f}`, import.meta.url)
await mkdir(out(''), { recursive: true })
await writeFile(out('hero.svg'), hero())
await writeFile(out('services.svg'), services())
await writeFile(out('stack.svg'), stack())
await writeFile(out('contact.svg'), contact())
for (const [i, link] of P.links.entries()) {
  await writeFile(out(`link-${link.id}.svg`), pill(link, i, 0.2))
}
console.log('Wrote hero, services, stack, contact and link pills')
