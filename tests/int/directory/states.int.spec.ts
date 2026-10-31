// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { DirectoryError, DirectoryLoading } from '@/Directory/States'
afterEach(cleanup)
describe('Directory asynchronous boundaries', () => {
  it('announces loading', () => {
    const v = render(createElement(DirectoryLoading))
    expect(v.getByRole('status').textContent).toContain('იტვირთება')
    expect(v.getByRole('main').getAttribute('aria-busy')).toBe('true')
  })
  it('shows a safe error and retries', () => {
    const reset = vi.fn(),
      v = render(createElement(DirectoryError, { reset }))
    expect(v.getByRole('alert').textContent).toContain('დროებით მიუწვდომელია')
    fireEvent.click(v.getByRole('button', { name: 'ხელახლა ცდა' }))
    expect(reset).toHaveBeenCalledOnce()
  })
})
