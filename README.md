# Bot Among Us

Bot de Discord para controlar los canales de voz en partidas de Among Us.

## Instalación

1. Copia `.env.example` a `.env` y añade el token de tu bot.
2. Ejecuta `npm install`.
3. Ejecuta `npm start`.

## Añadir un comando

Crea un archivo en `src/commands/`. Debe exportar `data` (el constructor de slash command), `execute` (la función) y, opcionalmente, `aliases` para comandos de texto. El cargador lo detecta y lo registra al reiniciar el bot.

La lógica de voz se mantiene en `src/services/`, un archivo por función. `index.js` solo inicia el cliente y conecta los manejadores.
