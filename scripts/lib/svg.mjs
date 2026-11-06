// Shared design tokens and helpers for the profile SVGs.
// Tokens mirror the portfolio (mohammadalbast.com): app/(frontend)/globals.css.

import { readFileSync } from 'node:fs'

export const T = {
  page: '#151515',
  card: '#2a2a2a',
  inset: '#0e0e0e',
  muted: '#222222',
  border: '#393939',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  heading: '#f3fff0',
  mint: '#85fd9c',
  paper: '#effff1',
  paperAccent: '#0b7020',
  webflow: '#85b7eb',
  fullstack: '#ed93b1',
}

export const W = 860 // every full-width SVG shares this width, so they line up in the README

const font = (file) => readFileSync(new URL(`../fonts/${file}`, import.meta.url)).toString('base64')

/** @font-face rules with the fonts embedded: images on GitHub can't load external fonts. */
export function fontCss({ sans = true, mono = true } = {}) {
  let css = ''
  if (sans) css += `@font-face{font-family:'Plex Sans';src:url(data:font/woff2;base64,${font('plex-sans-400.woff2')}) format('woff2')}`
  if (mono) css += `@font-face{font-family:'Plex Mono';src:url(data:font/woff2;base64,${font('plex-mono-400.woff2')}) format('woff2')}`
  return css
}

/** Plex Mono is monospaced at 600 units per em, so mono text widths are exact. */
export const monoWidth = (text, size) => [...text].length * size * 0.6

export function wrapMono(text, size, maxWidth) {
  const perLine = Math.floor(maxWidth / (size * 0.6))
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > perLine && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Animation library: everything plays once on load and ends visible; reduced motion shows the final frame. */
export const motionCss = `
.sans{font-family:'Plex Sans',ui-sans-serif,system-ui,sans-serif}
.mono{font-family:'Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
.rise{animation:rise .8s cubic-bezier(.2,.7,.2,1) both}
.fade{animation:fade .7s ease-out both}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .5s cubic-bezier(.3,1.4,.5,1) both}
.draw{stroke-dasharray:2000;animation:draw 1.4s ease-out both}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.2s ease-out infinite}
.blink{animation:blink 1s steps(1) infinite}
@keyframes rise{from{opacity:0;transform:translateY(14px)}}
@keyframes fade{from{opacity:0}}
@keyframes pop{from{opacity:0;transform:scale(.6)}}
@keyframes draw{from{stroke-dashoffset:2000}}
@keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

export const d = (s) => `animation-delay:${s.toFixed(2)}s`

export function svg({ width = W, height, label, css = '', fonts, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">
<style>${fontCss(fonts)}${motionCss}${css}</style>
${body}
</svg>
`
}

/** Section panel: the dark page surface, so every image reads the same in GitHub's light and dark themes. */
export const panel = (height, width = W) =>
  `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${T.page}" stroke="${T.border}"/>`

/** The portfolio's display heading: <Title/> with mint brackets. */
export const codeHeading = (text, x, y, delay = 0.1, size = 34) =>
  `<text class="sans rise" style="${d(delay)}" x="${x}" y="${y}" font-size="${size}" fill="${T.heading}"><tspan class="fade" style="${d(delay + 0.25)}" fill="${T.mint}">&lt;</tspan>${esc(text)}<tspan class="fade" style="${d(delay + 0.4)}" fill="${T.mint}">/&gt;</tspan></text>`
