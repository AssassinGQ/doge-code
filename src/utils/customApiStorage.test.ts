import { describe, it, expect, vi } from 'bun:test'
import { readCustomApiStorage } from './customApiStorage'

describe('CustomApiStorage', () => {
  describe('readCustomApiStorage', () => {
    it('parses legacy provider field', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          provider: 'openai',
          model: 'gpt-4',
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.provider).toBe('openai')
      expect(result.model).toBe('gpt-4')
    })

    it('parses new providers per-model mapping', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          providers: {
            'gpt-4': 'openai',
            'claude-3': 'anthropic',
          },
          model: 'gpt-4',
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.providers).toEqual({
        'gpt-4': 'openai',
        'claude-3': 'anthropic',
      })
    })

    it('returns both provider and providers when both are set', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          provider: 'openai',
          providers: {
            'gpt-4': 'gemini',
          },
          model: 'gpt-4',
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.provider).toBe('openai') // fallback preserved
      expect(result.providers?.['gpt-4']).toBe('gemini') // per-model takes precedence
    })

    it('parses savedModels array', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          savedModels: ['gpt-4', 'gpt-3.5', 'claude-3'],
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.savedModels).toEqual(['gpt-4', 'gpt-3.5', 'claude-3'])
    })

    it('filters out non-string items from savedModels', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          savedModels: ['gpt-4', 123, null, 'claude-3', undefined, true],
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.savedModels).toEqual(['gpt-4', 'claude-3'])
    })

    it('returns undefined for invalid provider value', () => {
      const mockData: Record<string, unknown> = {
        customApiEndpoint: {
          provider: 'invalid-provider',
        },
      }
      const storage = require('./secureStorage/index.js')
      vi.spyOn(storage, 'getSecureStorage').mockReturnValue({
        read: () => mockData,
        update: () => ({ success: true }),
      })

      const result = readCustomApiStorage()

      expect(result.provider).toBeUndefined()
    })
  })
})
