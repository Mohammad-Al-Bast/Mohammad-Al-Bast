// Builds assets/project-graph.svg: an animated git graph of published projects.
// Projects come from the portfolio CMS (Payload REST API); if it is unreachable or
// has nothing published, data/projects.json is used instead.
// Node 20+, no dependencies.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { T, W as PAGE_W, svg, panel, codeHeading } from './lib/svg.mjs'

const SITE = 'https://mohammadalbast.com'
const API = `${SITE}/api/projects?where[_status][equals]=published&sort=order&depth=0&limit=12`
const MAX_PER_BRANCH = 3

const C = {
  bg: T.inset,
  border: T.border,
  dim: '#6b6b6b',
  text: T.text,
  main: T.mint,
  webflow: T.webflow,
  full: T.fullstack,
}

async function loadProjects() {
  try {
    const res = await fetch(API, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { docs = [] } = await res.json()
    const list = docs.filter((d) => d?.name).map((d) => ({ name: d.name, category: d.category }))
    if (list.length) {
      console.log(`Using ${list.length} published project(s) from the CMS`)
      return list
    }
    console.log('CMS has no published projects; using data/projects.json')
  } catch (err) {
    console.log(`CMS unreachable (${err.message}); using data/projects.json`)
  }
  return JSON.parse(await readFile(new URL('../data/projects.json', import.meta.url), 'utf8'))
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const clip = (s, n = 24) => {
  if (s.length <= n) return s
  const cut = s.slice(0, n).lastIndexOf(' ')
  return cut > n / 2 ? s.slice(0, cut) : s.slice(0, n - 1).trimEnd() + '…'
}

function render(projects) {
  const web = projects.filter((p) => p.category === 'Webflow').slice(0, MAX_PER_BRANCH)
  const full = projects.filter((p) => p.category !== 'Webflow').slice(0, MAX_PER_BRANCH)

  const W = 860
  const H = 268
  const yMain = 88
  const yWeb = 150
  const yFull = 218
  const xStart = 40
  const xEnd = 820
  const labelX = 24
  const charW = 7.8

  let delay = 0.3
  const step = 0.25
  const parts = []

  // main line
  parts.push(`<path class="draw" style="animation-delay:${delay}s" d="M${xStart} ${yMain} H${xEnd}" stroke="${C.main}"/>`)
  parts.push(`<circle class="pop" style="animation-delay:${delay}s" cx="${xStart}" cy="${yMain}" r="6" fill="${C.main}"/>`)
  parts.push(`<text class="fade" style="animation-delay:${delay}s" x="${xStart}" y="${yMain - 16}" fill="${C.dim}" text-anchor="middle">2021</text>`)
  parts.push(`<text class="fade" style="animation-delay:${delay}s" x="${labelX}" y="${yMain + 24}" fill="${C.main}">main</text>`)
  delay += step

  const branch = (items, y, color, label, forkX, mergeX) => {
    if (!items.length) return
    const d = `M${forkX} ${yMain} C${forkX + 45} ${yMain} ${forkX + 45} ${y} ${forkX + 90} ${y} H${mergeX - 90} C${mergeX - 45} ${y} ${mergeX - 45} ${yMain} ${mergeX} ${yMain}`
    parts.push(`<path class="draw" style="animation-delay:${delay}s" d="${d}" stroke="${color}"/>`)
    parts.push(`<text class="fade" style="animation-delay:${delay}s" x="${labelX}" y="${y + 4}" fill="${color}">${label}</text>`)
    delay += step
    // commits sit on the straight part of the branch, clear of both curves
    const span = [forkX + 105, mergeX - 105]
    const spanW = span[1] - span[0]
    const n = items.length
    const gap = n > 1 ? spanW / (n - 1) : 0
    // edge labels anchor inward so they never run onto the curves; with 3 commits the two
    // edge labels share the top row, so each gets half the branch
    const maxChars = n === 3 ? Math.floor((spanW / 2 - 12) / charW) : Math.floor((spanW + 60) / charW)
    items.forEach((p, i) => {
      const x = n > 1 ? span[0] + gap * i : span[0] + spanW / 2
      const above = i % 2 === 0
      const ty = above ? y - 14 : y + 24
      const anchor = n === 1 || (n === 3 && i === 1) ? 'middle' : i === 0 ? 'start' : 'end'
      const tx = anchor === 'start' ? x - 8 : anchor === 'end' ? x + 8 : x
      parts.push(`<circle class="pop" style="animation-delay:${delay}s" cx="${x}" cy="${y}" r="6" fill="${C.bg}" stroke="${color}" stroke-width="2.5"/>`)
      parts.push(`<text class="fade" style="animation-delay:${delay}s" x="${tx}" y="${ty}" fill="${C.text}" text-anchor="${anchor}">${esc(clip(p.name, maxChars))}</text>`)
      delay += step
    })
  }

  branch(web, yWeb, C.webflow, 'webflow', 180, 740)
  branch(full, yFull, C.full, 'full-stack', 150, 770)

  // HEAD
  parts.push(`<circle class="pop" style="animation-delay:${delay}s" cx="${xEnd}" cy="${yMain}" r="7" fill="${C.main}"/>`)
  parts.push(`<circle class="pulse" style="animation-delay:${delay + 0.4}s" cx="${xEnd}" cy="${yMain}" r="7" fill="none" stroke="${C.main}"/>`)
  parts.push(`<text class="fade" style="animation-delay:${delay}s" x="${xEnd}" y="${yMain - 18}" fill="${C.main}" text-anchor="end">HEAD → mohammadalbast.com</text>`)

  // the window keeps its own 860-wide coordinates and is scaled into the page panel
  const PH = 372
  const scale = 780 / W
  const body = `${panel(PH, PAGE_W)}
${codeHeading('Projects', 40, 70)}
<text class="mono fade" style="animation-delay:.5s" x="820" y="70" font-size="12" fill="${T.textMuted}" text-anchor="end">synced from mohammadalbast.com</text>
<g transform="translate(40 96) scale(${scale.toFixed(4)})">
<g class="mono graph">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${C.bg}" stroke="${C.border}"/>
<circle cx="24" cy="22" r="5" fill="#444"/><circle cx="42" cy="22" r="5" fill="#444"/><circle cx="60" cy="22" r="5" fill="${C.main}" opacity=".8"/>
<text x="80" y="26" fill="${C.dim}" font-size="12">git log --graph --all</text>
<line x1="0" y1="42" x2="${W}" y2="42" stroke="${C.border}"/>
${parts.join('\n')}
</g>
</g>`
  return svg({
    width: PAGE_W,
    height: PH,
    label: `Git graph of Mohammad Al Bast's projects: ${projects.map((p) => p.name).join(', ')}`,
    fonts: { sans: true, mono: true },
    css: '.graph text{font-size:13px}.graph path{fill:none;stroke-width:2.5;stroke-linecap:round}',
    body,
  })
}

const projects = await loadProjects()
await mkdir(new URL('../assets/', import.meta.url), { recursive: true })
await writeFile(new URL('../assets/project-graph.svg', import.meta.url), render(projects))
console.log('Wrote assets/project-graph.svg')
