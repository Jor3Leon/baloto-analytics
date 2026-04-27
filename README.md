# 🎰 Baloto Analytics - Cloud Ready

Este proyecto es una herramienta avanzada para el análisis y generación de combinaciones de Baloto, ahora con persistencia en la nube mediante **Supabase** y listo para ser desplegado en **Render**.

## 🚀 Despliegue en Render

1. **Subir a GitHub**:
   - Crea un repositorio nuevo en GitHub.
   - Sube todos los archivos (asegúrate de que `.gitignore` incluya `.env`).
2. **Conectar a Render**:
   - Crea un nuevo **Web Service** en [Render](https://render.com).
   - Conecta tu repositorio de GitHub.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Variables de Entorno en Render**:
   En la pestaña "Environment" de Render, agrega:
   - `SUPABASE_URL`: `https://fuygccurtzjjbstwxaly.supabase.co`
   - `SUPABASE_ANON_KEY`: `sb_publishable_4a508AX-u2-eN0QpPOjdKg_TRi6nLfT`

## 🛠️ Tecnologías
- **Frontend**: HTML5, Vanilla CSS, JS (Async/Await).
- **Backend**: Node.js, Express, Cheerio (Web Scraping).
- **Base de Datos**: Supabase (PostgreSQL).

## 📄 Estructura de la Base de Datos
Ejecuta esto en el SQL Editor de Supabase:

```sql
CREATE TABLE draws (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date_label TEXT UNIQUE NOT NULL,
  nums JSONB NOT NULL,
  super_ball INTEGER NOT NULL,
  source TEXT DEFAULT 'scraper',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  d TEXT NOT NULL,
  b JSONB NOT NULL,
  bs INTEGER NOT NULL,
  r JSONB NOT NULL,
  rs INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📝 Notas
La aplicación guarda automáticamente las combinaciones generadas en la nube. Si no hay conexión a Supabase, funcionará localmente usando `localStorage`.
