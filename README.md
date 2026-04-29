# 🎰 Baloto Analytics - Pro Max Edition

Herramienta profesional de modelado estadístico y análisis predictivo para el sorteo Baloto Colombia. Implementa un sistema de **Glassmorphism UI** y sincronización automatizada de datos en la nube.

## ✨ Características Principales

- **Automatización Total**: Sistema de sincronización silenciosa cada 6 horas. Sin botones manuales, los datos siempre están frescos.
- **Motor Estadístico Avanzado**: Análisis de números calientes, fríos, días de atraso y patrones de tríos/pares.
- **Visualización Pro**: Gráficos interactivos de tendencia y frecuencia usando Chart.js.
- **Persistencia en la Nube**: Integración nativa con Supabase para historial compartido y sorteos reales.
- **Exportación**: Generador de reportes en PDF con un solo clic.

## 🚀 Despliegue en Render

1. **GitHub**: Sube el código a tu repositorio.
2. **Render**: Crea un **Web Service** y conecta el repo.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Variables de Entorno**:
   - `SUPABASE_URL`: Tu URL de Supabase.
   - `SUPABASE_ANON_KEY`: Tu clave anónima.
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu clave de rol de servicio (para el scraper).
   - `ALLOWED_ORIGINS`: URLs permitidas separadas por coma.

## 🛠️ Stack Técnico

- **Backend**: Node.js + Express + Cheerio (Scraper).
- **Frontend**: Vanilla JS + CSS Glassmorphism + Supabase Client.
- **Infraestructura**: Supabase (PostgreSQL) + Render Hosting.

---
**Desarrollado por: iFoxSitO**

*Nota: Esta aplicación es netamente estadística y de entretenimiento, no garantiza premios. Juegue con responsabilidad.*
