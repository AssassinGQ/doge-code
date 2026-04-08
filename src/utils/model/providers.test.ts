import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { getProviderForModel } from './providers'

// Mock readCustomApiStorage
vi.mock('../customApiStorage', () => ({
  readCustomApiStorage: vi.fn(),
}))

describe('getProviderForModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns explicit provider from providers map', async () => {
    const { readCustomApiStorage } = await import('../customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      provider: 'anthropic',
      providers: { 'gpt-4o': 'openai' },
    })
    const result = getProviderForModel('gpt-4o')
    expect(result).toBe('openai')
  })

  it('falls back to global provider when no explicit mapping', async () => {
    const { readCustomApiStorage } = await import('../customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      provider: 'openai',
      providers: {},
    })
    const result = getProviderForModel('some-unknown-model')
    expect(result).toBe('openai')
  })

  it('defaults to anthropic when no provider config', async () => {
    const { readCustomApiStorage } = await import('../customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      provider: undefined,
      providers: {},
    })
    const result = getProviderForModel('any-model')
    expect(result).toBe('anthropic')
  })

  it('returns anthropic when model not in providers map', async () => {
    const { readCustomApiStorage } = await import('../customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      provider: 'anthropic',
      providers: { 'gpt-4o': 'openai' },
    })
    const result = getProviderForModel('claude-3-5-sonnet')
    expect(result).toBe('anthropic')
  })

  it('handles empty providers object with no global provider', async () => {
    const { readCustomApiStorage } = await import('../customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      provider: undefined,
      providers: {},
    })
    const result = getProviderForModel('')
    expect(result).toBe('anthropic')
  })
})