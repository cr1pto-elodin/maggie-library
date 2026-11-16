function readEnvironmentValue(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name]

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined
}

export function readString(
  name: keyof ImportMetaEnv,
  fallback: string,
): string {
  return readEnvironmentValue(name) ?? fallback
}

export function readPositiveInteger(
  name: keyof ImportMetaEnv,
  fallback: number,
): number {
  const value = readEnvironmentValue(name)

  if (value === undefined) {
    return fallback
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} precisa ser um número inteiro positivo.`)
  }

  const parsedValue = Number(value)

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} precisa ser um número inteiro positivo.`)
  }

  return parsedValue
}
