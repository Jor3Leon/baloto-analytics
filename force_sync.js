require('dotenv').config();
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeBaloto(pages = 40) {
  const allItems = [];
  const dateOccurrences = {};
  for (let page = 1; page <= pages; page++) {
    const url = `https://www.baloto.com/resultados/${page > 1 ? '?page=' + page : ''}`;
    console.log('Fetching', url);
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

async function run() {
  console.log('Iniciando scraper profundo (40 paginas)...');
  const draws = await scrapeBaloto(40);
  console.log(`Encontrados ${draws.length} sorteos. Subiendo a Supabase...`);
  
  if (draws.length > 0) {
    const { error } = await supabase
      .from('draws')
      .upsert(draws, { onConflict: 'date_label' });
    if (error) {
      console.error('Error al subir a Supabase:', error.message);
    } else {
      console.log('¡Sincronización profunda completada con éxito!');
    }
  }
}

run();
