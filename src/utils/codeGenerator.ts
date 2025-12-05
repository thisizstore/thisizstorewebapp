export function generateCode(prefix: string): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`.slice(0, 10);
}

export function generateJPCode(): string {
  return generateCode('JP');
}

export function generateJCCode(): string {
  return generateCode('JC');
}
