import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test'
import { call } from './add-model'

// Mock dependencies
vi.mock('../../utils/customApiStorage', () => ({
  readCustomApiStorage: vi.fn(),
  writeCustomApiStorage: vi.fn(),
}))

vi.mock('../../utils/config', () => ({
  saveGlobalConfig: vi.fn(),
}))

const originalAnthropicModel = process.env.ANTHROPIC_MODEL

describe('/add-model command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset ANTHROPIC_MODEL before each test
    if (originalAnthropicModel !== undefined) {
      process.env.ANTHROPIC_MODEL = originalAnthropicModel
    } else {
      delete process.env.ANTHROPIC_MODEL
    }
  })

  it('returns usage error when no arguments provided', async () => {
    const result = await call('', {} as any)
    expect(result.type).toBe('text')
    expect(result.value).toContain('Usage')
    expect(result.value).toContain('provider')
  })

  it('returns usage error when provider not provided', async () => {
    const result = await call('gpt-4o', {} as any)
    expect(result.type).toBe('text')
    expect(result.value).toContain('Usage')
    expect(result.value).toContain('provider')
  })

  it('returns error for invalid provider', async () => {
    const result = await call('gpt-4o invalid-provider', {} as any)
    expect(result.type).toBe('text')
    expect(result.value).toContain('Invalid provider')
    expect(result.value).toContain('anthropic, openai, gemini')
  })

  it('successfully adds model with valid provider', async () => {
    const { readCustomApiStorage, writeCustomApiStorage } = await import('../../utils/customApiStorage')
    const { saveGlobalConfig } = await import('../../utils/config')

    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({ providers: {}, savedModels: [] })

    const result = await call('gpt-4o openai', {} as any)
    expect(result.type).toBe('text')
    expect(result.value).toContain('Added custom model: gpt-4o')
    expect(result.value).toContain('openai')
    expect(writeCustomApiStorage).toHaveBeenCalled()
    expect(saveGlobalConfig).toHaveBeenCalled()
  })

  it('adds model to providers map with correct provider', async () => {
    const { readCustomApiStorage, writeCustomApiStorage } = await import('../../utils/customApiStorage')
    const { saveGlobalConfig } = await import('../../utils/config')

    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({ providers: {}, savedModels: [] })

    await call('claude-3-5-sonnet anthropic', {} as any)

    expect(writeCustomApiStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: { 'claude-3-5-sonnet': 'anthropic' },
      })
    )
  })

  it('keeps existing models in providers map', async () => {
    const { readCustomApiStorage, writeCustomApiStorage } = await import('../../utils/customApiStorage')

    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({
      providers: { 'existing-model': 'gemini' },
      savedModels: ['existing-model'],
    })

    await call('gpt-4o openai', {} as any)

    expect(writeCustomApiStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: {
          'existing-model': 'gemini',
          'gpt-4o': 'openai',
        },
      })
    )
  })

  it('sets ANTHROPIC_MODEL env var', async () => {
    const { readCustomApiStorage } = await import('../../utils/customApiStorage')
    ;(readCustomApiStorage as ReturnType<typeof vi.fn>).mockReturnValue({ providers: {}, savedModels: [] })

    await call('gpt-4o openai', {} as any)
    expect(process.env.ANTHROPIC_MODEL).toBe('gpt-4o')
  })

  it('returns usage error for whitespace-only model name', async () => {
    // After trim, '  ' becomes '' which is falsy
    const result = await call('  ', {} as any)
    expect(result.type).toBe('text')
    expect(result.value).toContain('Usage')
  })
})