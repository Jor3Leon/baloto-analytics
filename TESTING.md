# Checklist de pruebas

Usa esta lista para validar la app despues de abrirla en `localhost` o XAMPP.

## 1. Carga inicial

- Abrir la app desde `http://localhost/...`
- Confirmar que el fondo, los paneles y los botones cargan sin errores visuales
- Verificar que no aparezcan mensajes de consola en rojo

## 2. Sincronizacion manual

- Hacer clic en `Sincronizar Baloto`
- Confirmar que aparece un aviso de sincronizacion
- Verificar que se agregan sorteos nuevos solo si hay datos recientes publicados
- Repetir el clic y comprobar que no se duplican sorteos

## 3. Sincronizacion automatica

- Dejar la app abierta despues de un sorteo
- Revisar que el proceso se ejecute solo una vez por ventana de sorteo
- Confirmar que la app no marque como completada una sincronizacion fallida

## 4. Graficas

- Abrir `Ver graficas`
- Confirmar que la ventana modal se ve completa
- Verificar que las curvas, puntos y etiquetas sean legibles
- Revisar que en movil exista scroll horizontal solo cuando sea necesario

## 5. Recomendaciones

- Abrir `Ver analisis`
- Confirmar que el panel se renderiza en modal
- Validar que las combinaciones propuestas tengan score y metadatos visibles

## 6. Responsive

- Probar en pantalla de escritorio
- Probar en pantalla dividida
- Probar en movil o modo responsive del navegador
- Confirmar que:
  - el encabezado no se rompe
  - los botones no se superponen
  - las tarjetas no se salen del ancho
  - la modal mantiene margen lateral

## 7. Importacion y exportacion

- Importar un CSV de ejemplo desde `data/baloto_historico_ejemplo.csv`
- Verificar que se agreguen solo filas validas
- Exportar el historico actual a CSV
- Confirmar que el archivo descargado contiene `nums` y `super`

## 8. Persistencia

- Recargar la pagina
- Confirmar que el historico siga disponible si se guardo en `localStorage`
- Verificar que el modo y los datos sigan coherentes despues del reload

## Criterio de exito

La prueba se considera correcta si:

- la app carga sin romper la interfaz,
- la sincronizacion trae datos o informa correctamente cuando no hay novedades,
- las graficas son legibles en desktop y movil,
- y no se duplican sorteos al sincronizar varias veces.
