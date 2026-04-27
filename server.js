require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Helper for scraping
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
        
        // Match dates and numbers like "27 de Abril de 2024 12-16-29-30-41-14"
        const pattern = /(\d{1,2}\s+de\s+[^\d]+?\s+de\s+\d{4})\s+((?:\d{1,2}\s*-\s*){5}\d{1,2})/gi;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const numbers = match[2].split('-').map(n => parseInt(n.trim()));
            if (numbers.length >= 6) {
                const baseDate = match[1].trim();
                dateOccurrences[baseDate] = (dateOccurrences[baseDate] || 0) + 1;
                const suffix = dateOccurrences[baseDate] === 1 ? ' - Baloto' : ' - Revancha';
                
                allItems.push({
                    date_label: baseDate + suffix,
                    nums: numbers.slice(0, 5),
                    super_ball: numbers[5],
                    source: 'baloto.com'
                });
            }
        }
        if (allItems.length === 0) break; 
    }
    return allItems;
}

// Endpoint for manual sync
app.get('/api/sync', async (req, res) => {
    try {
        const pages = parseInt(req.query.pages) || 2;
        const draws = await scrapeBaloto(pages);
        
        // Save to Supabase (Upsert based on date_label)
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
