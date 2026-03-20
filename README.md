# DiaCero - Plataforma de Aprendizaje Estructurado

Plataforma educativa moderna impulsada por un enfoque en maximizar el rendimiento cognitivo de los estudiantes a través de módulos interactivos de "Línea Base de Enfoque".

---

## 🌟 Características Principales

* 🚀 **Sistema de Módulos (Module Viewer)**: Interfaz estructurada verticalmente con seguimiento de lectura, secciones de contenido interactivas, integración multimedia (videos/imágenes 16:9), y asistente inteligente (IA) nativo en contexto.
* 🎓 **Panel del Estudiante**: Panel individual (Dashboard) donde los alumnos pueden apreciar de un pantazo sus estadísticas de aprendizaje, tiempo de concentración, progreso porcentual y puntajes evaluativos.
* 🛡️ **Panel de Administración**: Centro de monitoreo general del piloto para visualizar en tiempo real el progreso de los usuarios afiliados, puntajes de finalización y estado de los perfiles (Activos/Inactivos/Completados), construido con KPIs e indicadores de semáforo.
* 📝 **Evaluaciones y Feedback**: Sistema de cuestionarios (Quizzes) adaptativos y encuestas de retroalimentación totalmente integrados para medir el pulso final al culminar el material de estudio.
* 🎨 **Diseño Responsivo Total**: Una capa visual de alta jerarquía diseñada con Tailwind y animaciones `framer-motion`/shadcn para una inmersión "premium". Además, incluye inyección de Logos Vectorizados (Componentes híbridos SVG/PNG) altamente escalables.

---

## 🛠️ Stack Tecnológico

* [Next.js 14+](https://nextjs.org/) (App Router)
* [React](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* Componentes de Interfaz: Accesorios basados en la especificación [Shadcn UI](https://ui.shadcn.com/)
* Iconografía visual: [Lucide React](https://lucide.dev/)
* *Node Engine, Pre-empaquetado Firebase Studio Exports y Genkit Analytics.*

---

## 🧭 Mapa de Rutas

* **`/`** — Página de aterrizaje (Landing page) de impacto para atraer la atención.
* **`/auth/login`** — Formulario de autenticación del módulo piloto.
* **`/dashboard`** — Centro de usuario y punto de acceso al aprendizaje.
* **`/admin/dashboard`** — Panel de supervisor / facilitador con la cuadrícula de análisis.
* **`/module/[id]`** — Visor central y responsivo del módulo de curso.

---

## 🚀 Desarrollo Local (Modo Piloto)

1. **Instalar el núcleo de dependencias** e inyectar de manera segura las definiciones complementarias ocultas que exige la arquitectura analítica (por ej. `aws-lambda`, `mysql`):
   ```bash
   npm install
   npm install -D @types/aws-lambda @types/mysql
   ```

2. **Levantar el servidor local** en modo desarrollo:
   ```bash
   npm run dev
   ```

3. **Interactuar** accediendo mediante el navegador a `http://localhost:9002` (o el puerto emitido por la consola).

---

## ⚙️ Gestión de Datos y Contenido

Al estar configurado como Programa Piloto sin requerimiento estricto de base de datos todavía (uso de estados estáticos y caché temporal en entorno de pruebas), se proveen estos módulos:

* **Contenidos Educativos**: El plan de estudio actual *"DiaCero: Fundamentos del Crecimiento Intelectual"*, junto con sus quizzes y enlaces lógicos de recursos audiovisuales se estructuran libremente desde `src/lib/module-data.ts`.
* **Métricas Mockeables**: La lista de alumnos evaluables por el gestor de la cohorte en el panel administrativo es editable desde `src/lib/mock-users.ts`.
* **Logotipos Flexibles**: El logo del encabezado está programado mediante una subrutina propia en `components/ui/logo.tsx`. Puedes proveer un archivo nativo llamado `logo.png` directamente en tu carpeta de assets global `public/` y la aplicación forzará su visualización dinámica. De lo contrario, mantendrá un excelente renderizado digital predefinido en vectores.
