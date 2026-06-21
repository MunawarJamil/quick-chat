const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'secret',
  'clientSecret',
];

export function redactSensitiveData(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([key, fieldValue]) => {
        const shouldRedact = SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase()),
        );

        return [
          key,
          shouldRedact ? '[REDACTED]' : redactSensitiveData(fieldValue),
        ];
      },
    ),
  );
}
