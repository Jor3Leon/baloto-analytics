# Baloto Analytics API Documentation

Bienvenido a la documentación de la API de Baloto Analytics. Esta API proporciona servicios de configuración, salud del sistema y sincronización de datos de sorteos históricos de Baloto.

## Información General

- **Base URL:** `https://baloto-analytics.onrender.com` (o localhost:3000 en desarrollo)
- **Formato de Respuesta:** JSON
- **Seguridad:** Algunos endpoints requieren un `SYNC_SECRET` para operaciones de escritura (cuando se accede externamente).

---

## 1. Configuración del Cliente

### Obtener Configuración Pública
Retorna las credenciales necesarias para que el frontend se conecte a Supabase (Anon Key).

**Endpoint:** `GET /api/config`

**Autenticación:** No requerida.

**Respuesta Exitosa (200 OK):**
```json
{
  "supabaseUrl": "https://xyz.supabase.co",
  "supabaseAnonKey": "eyJhbGciOiJIUzI1Ni..."
}
```

---

## 2. Sincronización de Datos

### Sincronizar Sorteos
Dispara el scraper para obtener los últimos sorteos desde baloto.com y los guarda en la base de datos.

**Endpoint:** `GET /api/sync`

**Parámetros de Consulta:**
- `pages` (opcional): Número de páginas a scrapear. Por defecto `2`. Máximo `40`.
- `token` (opcional): Token de seguridad si `SYNC_SECRET` está configurado en el servidor.

**Respuesta Exitosa (200 OK):**
```json
{
  "ok": true,
  "source": "baloto.com",
  "items": [
    {
      "date_label": "25 de abril de 2026 - Baloto",
      "nums": [1, 12, 23, 34, 43],
      "super_ball": 10,
      "source": "baloto.com"
    }
  ]
}
```

---

## 3. Estado del Sistema

### Health Check
Verifica que el servidor esté activo y respondiendo.

**Endpoint:** `GET /api/health`

**Respuesta Exitosa (200 OK):**
```json
{
  "ok": true,
  "timestamp": "2026-04-28T19:00:00.000Z"
}
```

---

## 4. Automatización

### Autosincronización en Segundo Plano
La aplicación está diseñada para ser autónoma. Cada vez que se accede a la raíz (`/`), el servidor verifica el tiempo transcurrido desde la última sincronización.

- **Frecuencia:** Cada 6 horas.
- **Acción:** Scrapea las 2 primeras páginas de resultados y actualiza Supabase automáticamente.
- **Transparencia:** El usuario no percibe esta operación, asegurando que los datos estén siempre frescos.

---

## 5. Manejo de Errores

La API utiliza códigos de estado HTTP estándar y un cuerpo de respuesta consistente para errores:

- `401 Unauthorized`: Token de sincronización inválido o ausente.
- `403 Forbidden`: Intento de acceder a archivos protegidos (.env, package.json).
- `429 Too Many Requests`: Se ha excedido el límite de velocidad (Rate Limit).
- `500 Internal Server Error`: Error inesperado en el servidor o falla en el scraping.

**Ejemplo de Error:**
```json
{
  "ok": false,
  "error": "Mensaje descriptivo del error"
}
```
