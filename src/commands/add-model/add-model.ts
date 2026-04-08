import type { LocalCommandCall } from '../../types/command.js'
import { saveGlobalConfig } from '../../utils/config.js'
import { readCustomApiStorage, writeCustomApiStorage, type CustomApiProvider } from '../../utils/customApiStorage.js'

const VALID_PROVIDERS: CustomApiProvider[] = ['anthropic', 'openai', 'gemini']

export const call: LocalCommandCall = async (args, _context) => {
  const parts = args.trim().split(/\s+/)
  const modelName = parts[0]
  const provider = parts[1] as CustomApiProvider | undefined

  if (!modelName) {
    return {
      type: 'text',
      value: 'Usage: /add-model <model-name> <provider>\nValid providers: anthropic, openai, gemini',
    }
  }

  if (!provider) {
    return {
      type: 'text',
      value: 'Usage: /add-model <model-name> <provider>\nValid providers: anthropic, openai, gemini',
    }
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    return {
      type: 'text',
      value: `Invalid provider: ${provider}\nValid providers: anthropic, openai, gemini`,
    }
  }

  saveGlobalConfig(current => ({
    ...current,
    customApiEndpoint: {
      ...current.customApiEndpoint,
      model: modelName,
      savedModels: [...new Set([...(current.customApiEndpoint?.savedModels ?? []), modelName])],
    },
  }))

  try {
    const secureStored = readCustomApiStorage()
    writeCustomApiStorage({
      ...secureStored,
      model: modelName,
      savedModels: [...new Set([...(secureStored.savedModels ?? []), modelName])],
      providers: {
        ...secureStored.providers,
        [modelName]: provider,
      },
    })
  } catch (error) {
    return {
      type: 'text',
      value: `Error: Failed to save model configuration`,
    }
  }

  process.env.ANTHROPIC_MODEL = modelName

  return {
    type: 'text',
    value: `Added custom model: ${modelName} (${provider})`,
  }
}
