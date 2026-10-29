import { describe, expect, it, vi } from 'vitest'
import { getCachedGlobal } from '@/utilities/getGlobals'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('next/cache', () => ({ unstable_cache: vi.fn((fn) => fn) }))
import { unstable_cache } from 'next/cache'

describe('Global cache identity', () => {
  it('separates differently populated versions of the same global', () => {
    getCachedGlobal('header', 0)
    getCachedGlobal('header', 1)
    const calls = vi.mocked(unstable_cache).mock.calls
    expect(calls.at(-2)?.[1]).not.toEqual(calls.at(-1)?.[1])
    expect(calls.at(-1)?.[2]?.tags).toEqual(['global_header'])
  })
})
