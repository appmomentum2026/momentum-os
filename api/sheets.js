export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sheet } = req.query;

  if (!sheet || !['horario', 'registro'].includes(sheet)) {
    return res.status(400).json({ error: 'Sheet inválido. Usa ?sheet=horario o ?sheet=registro' });
  }

  try {
    const SPREADSHEET_ID = '1le6AqGw4jlctjhXMDNZwSU1Gp7kJgS7G';
    const sheetName = sheet === 'horario' ? 'Horario S1' : 'Registro Diario Monitor';
    const token = await getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: 'Error consultando Google Sheets', detail: error });
    }

    const data = await response.json();
    const rows = data.values || [];

    if (sheet === 'horario') return res.status(200).json(procesarHorario(rows));
    else return res.status(200).json(procesarRegistro(rows));

  } catch (error) {
    return res.status(500).json({ error: 'Error interno', detail: error.message });
  }
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Faltan variables de entorno GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const payload = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${header}.${payload}`;
  const signature = await signJWT(signingInput, privateKey);
  const jwt = `${signingInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error('No se pudo obtener access token: ' + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

async function signJWT(input, privateKeyPem) {
  const pemContents = privateKeyPem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(input)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function procesarHorario(rows) {
  if (rows.length < 3) return { modelos: [], totalModelos: 0 };
  const modelos = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1] || row[1].trim() === '') continue;
    modelos.push({
      numero: row[0] || '',
      nombre: row[1] || '',
      modelo: row[2] || '',
      horaEntrada: row[3] || '',
      horaSalida: row[7] || '',
    });
  }
  return { modelos, totalModelos: modelos.length };
}

function procesarRegistro(rows) {
  if (rows.length < 4) return { modelos: [], totalModelos: 0 };
  const PLATAFORMAS = ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate', 'FNP', 'Otras'];
  const modelos = [];

  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1] || row[1].trim() === '' || row[1].includes('HORARIO')) continue;

    const tokensIndices = [3, 6, 9, 12, 15, 18];
    const plataformasData = {};
    let totalTokens = 0;

    PLATAFORMAS.forEach((plat, idx) => {
      const tkns = parseFloat(row[tokensIndices[idx]] || 0);
      const usd = tkns / 20;
      plataformasData[plat] = { tokens: tkns, usd: parseFloat(usd.toFixed(2)) };
      totalTokens += tkns;
    });

    let porcentaje = 60;
    if (totalTokens >= 70000) porcentaje = 70;
    else if (totalTokens >= 60000) porcentaje = 65;

    const totalUSD = totalTokens / 20;
    const pagoUSD = totalUSD * (porcentaje / 100);

    modelos.push({
      nombre: row[1] || '',
      nickModelo: row[2] || '',
      plataformas: plataformasData,
      totalTokens,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      porcentaje,
      pagoUSD: parseFloat(pagoUSD.toFixed(2)),
    });
  }
  return { modelos, totalModelos: modelos.length };
}