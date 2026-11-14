export function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} precisa ser um número inteiro positivo.`);
  }

  return value;
}

export function readNonNegativeInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} precisa ser um número inteiro não negativo.`);
  }

  return value;
}

export function readHttpUrl(name: string, fallback: string): string {
  const value = readNonEmptyString(name, fallback);
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} precisa ser uma URL válida.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} precisa usar o protocolo HTTP ou HTTPS.`);
  }

  return value.replace(/\/$/, '');
}

export function readNonEmptyString(name: string, fallback: string): string {
  const rawValue = process.env[name];
  const value = rawValue === undefined ? fallback : rawValue.trim();

  if (value.length === 0) {
    throw new Error(`${name} não pode ser vazio.`);
  }

  return value;
}
