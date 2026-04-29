const crypto = require('node:crypto');

function base64url(input) {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
}

function sign(payload, expiresInSeconds = 3600) {
  const secret = process.env.JWT_SECRET || 'codexa-dev-secret';
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const unsigned = `${base64url(header)}.${base64url(body)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsigned}.${signature}`;
}

function verify(token) {
  const secret = process.env.JWT_SECRET || 'codexa-dev-secret';
  const [headerPart, bodyPart, signature] = String(token || '').split('.');

  if (!headerPart || !bodyPart || !signature) {
    throw new Error('Token inválido.');
  }

  const unsigned = `${headerPart}.${bodyPart}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expected) {
    throw new Error('Assinatura inválida.');
  }

  const payload = decodeBase64url(bodyPart);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado.');
  }

  return payload;
}

module.exports = { sign, verify };
