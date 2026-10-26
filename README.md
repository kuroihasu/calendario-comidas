# Calendario de Comidas de Chile

Web (y pronto app) con los días de comida que se celebran en Chile: Día del Completo, del Chacarero, del Churrasco y más, con cuenta regresiva, página por día y suscripción al calendario.

Monorepo **Nx** con:

| Carpeta | Qué es |
| --- | --- |
| `apps/web` | Angular 21 con SSR (`@angular/ssr`). Web pública y panel `/admin`. El servidor Express también reenvía `/api` a la API. |
| `apps/api` | NestJS 11. REST en `/api/v1`, Prisma sobre PostgreSQL, sesión de admin en cookie httpOnly. |
| `libs/shared/contracts` | Esquemas Zod, tipos de respuesta, reglas de fecha en hora de Chile e ingredientes. Lo usan web y API. |
| `prisma/` | Esquema, migraciones y semilla con 14 días de comida. |

## Levantarlo en local

Requisitos: Node 22, pnpm 10 y PostgreSQL 16.

```bash
pnpm install
cp .env.example .env          # ajusta DATABASE_URL, JWT_SECRET y el admin inicial
pnpm db:migrate               # crea las tablas
pnpm db:seed                  # carga los días de comida y el admin
pnpm dev                      # API en :3000 y web en :4200 (con proxy a la API)
```

Panel de administración: `http://localhost:4200/admin`, con el correo y la clave de `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

Para producción: `pnpm build`, luego `node dist/apps/api/main.js` y `node dist/apps/web/server/server.mjs` (este último necesita `API_URL` y `ALLOWED_HOSTS`).

## API (fase 1)

| Método | Ruta | Devuelve |
| --- | --- | --- |
| GET | `/api/v1/calendar?year=2027&month=5` | Días del año o del mes, con fecha concreta |
| GET | `/api/v1/calendar/upcoming?limit=5` | Próximos días desde hoy (hora de Chile) |
| GET | `/api/v1/calendar.ics` | Suscripción para Google Calendar o Apple, con aviso la víspera |
| GET | `/api/v1/food-days` | Lista de días |
| GET | `/api/v1/food-days/{slug}` | Detalle, próxima fecha y días vecinos |
| GET | `/api/v1/food-days/{slug}.ics` | Evento del próximo año para agregar a un calendario |
| POST | `/api/v1/admin/login` · `/logout` · GET `/me` | Sesión de administrador |
| GET, POST, PATCH, DELETE | `/api/v1/admin/food-days[/{id}]` | Gestión de días (borrar solo rol admin) |
| POST | `/api/v1/admin/food-days/{id}/occurrences` | Corrige la fecha de un año puntual |

Todos los errores tienen la misma forma: `{ "error": { "code", "message", "details?", "requestId" } }`.

## Diseño

- La paleta sale del completo italiano (tomate, palta, mayo) y la pizarra verde de la fuente de soda. Una sola tipografía, Archivo, en ancho condensado para titulares.
- Cada día se dibuja como el corte de lo que se come, capa por capa, con los ingredientes guardados en `food_day.layers`. No hay fotos de terceros; `image_url` queda listo para cuando haya fotos propias.
- Movimiento: scroll suave con Lenis, entradas con GSAP + ScrollTrigger, transiciones de página con la View Transitions API (el dibujo viaja de la portada a la página del día) y las capas que se separan al bajar en "Qué lleva". Con "reducir movimiento" todo queda quieto y visible.

## Fechas por confirmar

Varias fechas no tienen fuente oficial (las publican sangucherías, marcas o medios). En la base quedan con `is_confirmed = false` y una nota en `source_note`; la web las marca como "por confirmar".
