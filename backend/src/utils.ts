import crypto from 'crypto';

export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataToCheck = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataToCheck).digest('hex');

  return calculatedHash === hash;
}

export function parseInitData(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const userJSON = urlParams.get('user');
  if (!userJSON) return null;
  return JSON.parse(userJSON);
}

