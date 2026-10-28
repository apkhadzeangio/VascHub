// DOM smoke check only; does not replace browser or native Figma validation.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const html = fs.readFileSync('docs/design/homepage-prototype.html', 'utf8')
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
const { document, Event, KeyboardEvent } = dom.window
assert.equal(document.documentElement.lang, 'ka')
assert.equal(document.querySelectorAll('.card').length, 3)
assert.equal(document.querySelectorAll('.topic').length, 6)
const input = document.querySelector('#search-input')
input.value = 'კაროტიდ'
input.dispatchEvent(new Event('input'))
assert.equal(document.querySelectorAll('.result').length, 1)
input.value = 'zz-no-match'
input.dispatchEvent(new Event('input'))
assert.equal(document.querySelectorAll('.result').length, 0)
input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
assert.equal(document.querySelector('#search-results').hidden, true)
assert.ok(document.querySelector('#menu-open').getAttribute('aria-controls'))
assert.equal(document.querySelectorAll('h1').length, 1)
assert.equal(document.querySelectorAll('form[role="search"]').length, 1)
dom.window.close()
console.log('PASS: Georgian search, empty state, Escape, 3 cards, 6 topics, labels and landmarks.')
console.log('Not verified here: native dialog focus trap, actual browser layout, native Figma layers.')
