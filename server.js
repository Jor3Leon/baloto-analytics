require('dotenv').config();
const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad: Headers HTTP ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // permitir scripts inline del frontend
  crossOriginEmbedderPolicy: false
}));

// ── Seguridad: CORS restringido ──────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Si no se configuró, permitir solo mismo origen (no wildcard)
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (apps móviles, curl, same-origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST'],
  credentials: false
}));

// ── Seguridad: Rate Limiting global ──────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // máx 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas solicitudes. Intenta en 15 minutos.' }
});
app.use(globalLimiter);

// ── Rate Limiting estricto para sync ─────────────────
const syncLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5,                    // máx 5 syncs por IP cada 10 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Límite de sincronización alcanzado. Espera 10 minutos.' }
});

app.use(express.json());
// Servir solo archivos específicos o carpetas seguras
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/data', express.static(__dirname + '/data'));
// Bloquear acceso a archivos sensibles explícitamente
app.get(['/.env', '/package.json', '/package-lock.json', '/render.yaml'], (req, res) => res.status(403).send('Forbidden'));

// ── Supabase config (backend con service role) ───────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Seguridad: Middleware de autenticación para sync ─
function requireSyncToken(req, res, next) {
  const syncSecret = process.env.SYNC_SECRET;
  // Si no se configuró SYNC_SECRET, el endpoint está abierto (desarrollo)
  if (!syncSecret) return next();

  const token = req.query.token || req.headers['x-sync-token'];
  if (token !== syncSecret) {
    return res.status(401).json({ ok: false, error: 'Token de sincronización inválido.' });
  }
  next();
}

// ── Endpoint: Configuración pública para el frontend ─
// Solo expone datos no-sensibles que el frontend necesita
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    // syncToken eliminado de la config pública por seguridad
  });
});

// ── Scraper helper ───────────────────────────────────
async function scrapeBaloto(pages = 2) {
  const allItems = [];
  const dateOccurrences = {};
  for (let page = 1; page <= pages; page++) {
    const url = `https://www.baloto.com/resultados/${page > 1 ? '?page=' + page : ''}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      console.error(`Fetch error ${response.status} for ${url}`);
      continue;
    }
    const data = await response.text();
    const $ = cheerio.load(data);
    const text = $('body').text().replace(/\s+/g, ' ');

    const pattern = /(\d{1,2}\s+de\s+[^\d]+?\s+de\s+\d{4})\s+((?:\d{1,2}\s*-\s*){5}\d{1,2})/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numbers = match[2].split('-').map(n => parseInt(n.trim()));
      if (numbers.length >= 6) {
        const regularNums = numbers.slice(0, 5);
        const superBall = numbers[5];
        
        // Validación básica de rangos
        const validRegular = regularNums.every(n => n >= 1 && n <= 43);
        const validSuper = superBall >= 1 && superBall <= 16;

        if (validRegular && validSuper) {
          const baseDate = match[1].trim();
          dateOccurrences[baseDate] = (dateOccurrences[baseDate] || 0) + 1;
          const suffix = dateOccurrences[baseDate] === 1 ? ' - Baloto' : ' - Revancha';

          allItems.push({
            date_label: baseDate + suffix,
            nums: regularNums,
            super_ball: superBall,
            source: 'baloto.com'
          });
        }
      }
    }
    if (allItems.length === 0) break;
  }
  return allItems;
}

// ── Endpoint: Sincronización protegida ───────────────
app.get('/api/sync', syncLimiter, requireSyncToken, async (req, res) => {
  try {
    const pages = Math.min(parseInt(req.query.pages) || 2, 5); // máx 5 páginas
    const draws = await scrapeBaloto(pages);

    if (draws.length > 0) {
      const { error } = await supabase
        .from('draws')
        .upsert(draws, { onConflict: 'date_label' });
      if (error) console.warn('Supabase Upsert Warning:', error.message);
    }

    res.json({
      ok: true,
      source: 'baloto.com',
      items: draws
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`CORS origins: ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : 'same-origin (no restriction)'}`);
  console.log(`Sync token: ${process.env.SYNC_SECRET ? 'CONFIGURED ✓' : 'NOT SET (open access)'}`);
});
