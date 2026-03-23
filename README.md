# DiaCero — Plataforma de Entrenamiento Normativo

> **Cero papeleo. 100% digital.** Plataforma educativa moderna para la capacitación en normativas de seguridad ocupacional chilena, diseñada para maximizar la retención y minimizar el tiempo fuera de faena.

---

## 🌟 Características Principales

| Feature | Descripción |
|---|---|
| 🔐 **Autenticación Real** | Login / registro unificado con **Supabase Auth** (email + contraseña). Auto-registro en el primer acceso. |
| 📚 **Módulos de Aprendizaje** | Visor estructurado verticalmente con secciones de contenido interactivas, integración multimedia (YouTube 16:9) y seguimiento de lectura por sección. |
| 🎓 **Dashboard del Estudiante** | Resumen de módulos asignados, barra de progreso por módulo, y acceso directo al certificado al completar. |
| 🛡️ **Panel de Administración** | Centro de monitoreo en tiempo real: progreso de cohorte, KPIs, indicadores semáforo (Activo / Inactivo / Completado) y puntajes de evaluación. |
| 📝 **Quizzes Integrados** | Sistema de cuestionarios adaptativos al final de cada módulo para validar el aprendizaje. |
| 🏅 **Certificados PDF** | Emisión automática de certificados firmados en formato A4 al completar un módulo. |
| 🎨 **Diseño Premium Responsivo** | UI ligera en modo claro con glassmorphism, paleta de marca corporativa, animaciones suaves y logo vectorial dinámico. |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) |
| **Frontend** | [React 19](https://react.dev/) |
| **Estilos** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Componentes UI** | [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Base de Datos & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth) |
| **Iconografía** | [Lucide React](https://lucide.dev/) |
| **Gráficos** | [Recharts](https://recharts.org/) |
| **IA (Opcional)** | [Genkit](https://firebase.google.com/docs/genkit) + Google GenAI |
| **Lenguaje** | TypeScript 5 |

---

## 🗄️ Arquitectura de Base de Datos (Supabase)

La plataforma usa **Supabase PostgreSQL** como fuente de verdad. Las tablas principales son:

```
modules          → Catálogo de módulos de curso (título, descripción, orden)
module_sections  → Secciones individuales de cada módulo (contenido, videos, tipo)
user_progress    → Progreso por usuario/módulo (secciones completadas, puntajes)
profiles         → Metadatos extendidos del usuario (rol: student | admin)
```

> **Row Level Security (RLS)** habilitado. Los usuarios solo pueden leer/escribir su propio progreso.

---

## 🧭 Mapa de Rutas

| Ruta | Descripción |
|---|---|
| `/` | Landing page + formulario de acceso unificado (login / registro) |
| `/dashboard` | Portal individual del estudiante con módulos asignados y progreso |
| `/module/[id]` | Visor central del módulo de curso |
| `/admin/dashboard` | Panel del administrador / facilitador (roles via `user_metadata.role`) |
| `/certificate/[id]` | Generación y descarga del certificado de finalización |

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes claves (obtenidas desde tu proyecto en [supabase.com](https://supabase.com/dashboard)):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## 🚀 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (ver sección anterior)
cp .env.local.example .env.local   # o créalo manualmente

# 3. Iniciar servidor de desarrollo (Turbopack, puerto 9002)
npm run dev
```

Accede a `http://localhost:9002` en tu navegador.

### Otros comandos útiles

```bash
npm run build       # Build de producción
npm run lint        # Linting con ESLint
npm run typecheck   # Verificación de tipos TypeScript
```

---

## 👤 Roles de Usuario

| Rol | Acceso | Configuración |
|---|---|---|
| **Estudiante** | Dashboard + módulos asignados | Por defecto al registrarse |
| **Administrador** | Todo lo anterior + `/admin/dashboard` | Requiere `user_metadata.role = 'admin'` en Supabase Auth |

Para promover un usuario a administrador, actualiza su metadata desde el panel de Supabase:
```json
{ "role": "admin" }
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                  # Rutas de Next.js (App Router)
│   ├── page.tsx          # Landing / Login
│   ├── dashboard/        # Portal del estudiante
│   ├── module/[id]/      # Visor de módulos
│   ├── admin/dashboard/  # Panel administrativo
│   └── certificate/[id]/ # Generación de certificados
├── components/
│   ├── ui/               # Shadcn UI + componentes base (logo.tsx, etc.)
│   └── module/           # Componentes del visor (Quiz, secciones, etc.)
├── lib/                  # Utilidades y datos estáticos de respaldo
└── utils/supabase/       # Cliente Supabase (client.ts / server.ts)
```

---

## 🔄 Gestión de Contenido

- **Módulos y Secciones**: administrados directamente desde las tablas `modules` y `module_sections` en Supabase.
- **Logo**: coloca `logo.png` en `/public/` para sobrescribir el logo SVG predeterminado (detectado automáticamente por `components/ui/logo.tsx`).
- **Fallback estático**: si no hay conexión a Supabase, `src/lib/module-data.ts` sirve como respaldo local de contenido.

---

## 📄 Licencia

Proyecto privado — © DiaCero. Todos los derechos reservados.
