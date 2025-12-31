export type SmsMisrLanguage = 1 | 2 | 3; // 1=Eng, 2=Arabic, 3=Unicode

export class SmsMisrError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(message);
  }
}

const SMSMISR_CODE_HINT: Record<string, string> = {
  '1902': 'Invalid request',
  '1903': 'Invalid username/password',
  '1904': 'Invalid sender (sender token / sender id not accepted)',
  '1905': 'Invalid mobile',
  '1906': 'Insufficient credit',
  '1907': 'Server updating',
  '1908': 'Invalid DelayUntil format',
  '1909': 'Invalid message',
  '1910': 'Invalid language',
  '1911': 'Text too long',
  '1912': 'Invalid environment',
  '4903': 'Invalid username/password (OTP)',
  '4904': 'Invalid sender (OTP)',
  '4905': 'Invalid mobile (OTP)',
  '4906': 'Insufficient credit (OTP)',
  '4907': 'Server updating (OTP)',
  '4908': 'Invalid OTP',
  '4909': 'Invalid template token (OTP)',
  '4912': 'Invalid environment (OTP)',
};

export async function sendSmsMisr(params: {
  apiUrl: string; // e.g. https://smsmisr.com/api/SMS/
  environment: 1 | 2; // 1=Live, 2=Test
  username: string;
  password: string;
  sender: string; // sender token / sender id
  mobile: string; // comma-separated 2011...,2012...
  language: SmsMisrLanguage;
  message: string;
  delayUntil?: string; // yyyyMMddHHmm
}) {
  const url = params.apiUrl || 'https://smsmisr.com/api/SMS/';
  const body = new URLSearchParams();
  body.set('environment', String(params.environment));
  body.set('username', params.username);
  body.set('password', params.password);
  body.set('sender', params.sender);
  body.set('mobile', params.mobile);
  body.set('language', String(params.language));
  body.set('message', params.message);
  if (params.delayUntil) body.set('DelayUntil', params.delayUntil);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // SMS Misr usually returns JSON; if not, keep raw.
  }

  if (!res.ok) {
    throw new SmsMisrError(`SMSMisr HTTP error (${res.status})`, undefined, {
      status: res.status,
      body: json ?? text,
    });
  }

  const code = json?.code;
  if (code !== '1901' && code !== '4901') {
    // 1901: SMS success, 4901: OTP success (same response shape)
    const hint = code ? SMSMISR_CODE_HINT[String(code)] : undefined;
    const msg = hint
      ? `SMSMisr error (${code}): ${hint}`
      : `SMSMisr error code ${code || 'unknown'}`;
    throw new SmsMisrError(msg, code, json ?? text);
  }

  return json ?? { ok: true };
}


