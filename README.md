# Canchas Capri & Caney - Sistema de Reservas

Sistema completo de reservas para canchas sintéticas con pasarela de pago PSE, integración con Google Calendar y panel de administración.

## Características

- Reservas en tiempo real con Socket.io
- Pasarela de pago PSE con selección de banco
- Sincronización automática con Google Calendar (una cuenta por cancha)
- Panel de administración (reservas, historial, códigos VIP, promociones)
- Modo oscuro
- Diseño responsive
- Sistema de códigos VIP (reservas sin pago)

## Precios

| Cancha | Antes 6pm | Después 6pm | Anticipo |
|---|---|---|---|
| Capri | $80,000 | $110,000 | $30,000 |
| Caney | $70,000 | $100,000 | $30,000 |

## Cómo correrlo localmente

```bash
npm install

# Terminal 1 - Servidor
npm run server

# Terminal 2 - Frontend
npm run dev
```

Abre `http://localhost:5173`

**Admin:** clic en el icono de escudo > contraseña: `admin123`

## Despliegue en Render

**Build Command:** `npm install && npm run build`
**Start Command:** `npm run start`

## Configurar Google Calendar (opcional)

Para que las reservas se sincronicen con Google Calendar:

### 1. Crear proyecto en Google Cloud
1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto
3. Habilita la **Google Calendar API**

### 2. Crear credenciales OAuth
1. Ve a **APIs y servicios > Credenciales**
2. Clic en **+ Crear credenciales > ID de cliente OAuth**
3. Tipo: **Aplicación web**
4. URI de redireccionamiento autorizados, agrega:
   - `http://localhost:3001/api/google/callback` (desarrollo)
   - `https://tu-dominio.onrender.com/api/google/callback` (producción)

### 3. Configurar variables de entorno

**Local:** crea archivo `.env`:
```
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
PUBLIC_URL=http://localhost:3001
```

**En Render:** ve a **Environment** y agrega:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PUBLIC_URL` (la URL de tu app en Render)

### 4. Conectar cuentas
1. Inicia sesión como admin
2. Ve a la pestaña **Calendar**
3. Conecta una cuenta de Google diferente para Capri y otra para Caney

## Pasarela de pago PSE

La pasarela PSE actual es **simulada** para demostración. Para producción real, integra con:
- **Wompi** (recomendado para Colombia)
- **PayU**
- **MercadoPago**
- **ePayco**

El flujo de pago en `server/index.js` (`/api/payments/initiate` y `/api/payments/:id/confirm`) está listo para conectar con cualquiera de estas pasarelas.

## Stack

- **Frontend:** React + Vite + TailwindCSS v4
- **Backend:** Node.js + Express + Socket.io
- **Base de datos:** JSON local (fácil de migrar a MongoDB/Firebase)
- **Tiempo real:** Socket.io
- **Calendario:** Google Calendar API
