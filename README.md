# House Tour — Análisis Técnico del Proyecto

## 1. Resumen Ejecutivo

**House Tour** es una aplicación web interactiva que presenta un recorrido virtual 3D por una vivienda (Deluxe Villa). Permite al usuario navegar mediante scroll, explorar waypoints predefinidos, controlar la iluminación según la hora del día y alternar entre recorrido guiado y cámara libre. Desarrollado por **Gemdam** como demo de Three.js con SSGI/N8AO.

---

## 2. Stack Tecnológico

### 2.1 Framework y Runtime

| Tecnología        | Versión  | Propósito                                                                 |
|-------------------|----------|---------------------------------------------------------------------------|
| **Next.js**       | 16.1.6   | Framework React con SSR/SSG, routing, optimización de assets y bundling  |
| **React**         | 19.2.3   | Librería UI, hooks, componentes                                          |
| **TypeScript**    | ^5       | Tipado estático, mejores DX y mantenibilidad                             |

### 2.2 Gráficos 3D

| Tecnología                 | Versión | Propósito                                                                 |
|----------------------------|---------|---------------------------------------------------------------------------|
| **Three.js**               | ^0.181.2| Motor 3D WebGL, geometrías, materiales, cámaras, escenas                 |
| **@react-three/fiber**     | ^9.5.0  | Integración declarativa de Three.js con React (render loop, reconciler)  |
| **@react-three/drei**      | ^10.7.7 | Helpers: ContactShadows, Environment, MeshReflectorMaterial, etc.        |
| **@react-three/postprocessing** | ^3.0.4 | Postprocesado (SSAO/N8AO) en React                                      |
| **postprocessing**         | ^6.38.2 | Librería base de postprocesado para WebGL                               |
| **three-stdlib**           | ^2.36.1 | Utilidades y componentes compartidos para three.js                       |

### 2.3 Estilos y UI

| Tecnología    | Versión | Propósito                                        |
|---------------|---------|--------------------------------------------------|
| **Tailwind CSS** | ^4   | Framework CSS utility-first, sistema de diseño   |
| **@tailwindcss/postcss** | ^4 | Integración PostCSS para Tailwind               |

### 2.4 Herramientas de Desarrollo

| Tecnología          | Propósito                    |
|---------------------|-----------------------------|
| **ESLint**          | Linting                     |
| **eslint-config-next** | Reglas ESLint para Next.js |
| **@types/node**, **@types/react**, **@types/react-dom** | Tipos TypeScript |

---

## 3. Arquitectura

### 3.1 Patrón General

La aplicación sigue una **arquitectura de componentes React** con:

- **App Router** (Next.js 16) en `app/`
- **Componentes reutilizables** en `components/`
- **Lógica de dominio y contexto** en `lib/`
- **Assets estáticos** en `public/`

### 3.2 Flujo de Entrada

```
app/page.tsx (SSR desactivado para Experience)
    └── Experience (cargado con dynamic import, ssr: false)
        └── TourScrollProvider / TourDebugProvider / MetricsProvider / KeyboardControls
            └── ExperienceWithIntro
                ├── TourExperienceInner (Canvas + UI)
                └── IntroOverlay (overlay inicial)
```

### 3.3 Render 3D

- **Canvas** (`@react-three/fiber`): contenedor WebGL con `shadows`, `dpr=[1,2]`, ACES Filmic tone mapping, PCFSoftShadowMap.
- **Scene**: iluminación, modelo 3D, sombras de contacto, postprocesado opcional (N8AO).
- **ScrollTour**: sincroniza el progreso del scroll con la posición de la cámara mediante curvas Catmull-Rom.

---

## 4. Estructura del Proyecto

```
house-tour/
├── app/
│   ├── globals.css          # Estilos globales + Tailwind + UI del tour
│   ├── layout.tsx           # Layout raíz, fuentes (Lexend), metadata
│   └── page.tsx             # Página principal (Experience con dynamic import)
├── components/
│   ├── CameraController.tsx # Cámara libre (WASD + PointerLock)
│   ├── CameraDebugUpdater.tsx
│   ├── Experience.tsx       # Punto de entrada del tour 3D
│   ├── FPSReporter.tsx      # Reporte de FPS al contexto
│   ├── House.tsx            # Carga y procesa modelo GLB
│   ├── IntroOverlay.tsx     # Overlay de bienvenida/carga
│   ├── LightEnvironment.tsx # Sol + Environment HDR
│   ├── LightingControls.tsx # Controles hora del día y rotación sol
│   ├── LoadedReporter.tsx   # Señaliza carga completa del modelo
│   ├── MetricsOverlay.tsx   # Panel FPS y métricas
│   ├── MirrorReplica.tsx    # Reflejos en espejos (MeshReflectorMaterial)
│   ├── Scene.tsx            # Escena 3D (luces, modelo, sombras, SSAO)
│   ├── ScrollTour.tsx       # Anima cámara según progreso del scroll
│   ├── TourBottomBar.tsx    # Barra inferior (vista libre, iluminación, postprocesado)
│   ├── TourDebugOverlay.tsx
│   └── WaypointsUI.tsx      # Puntos de recorrido clickeables
├── lib/
│   ├── math.ts              # Utilidades: damp, lerp, fract
│   ├── metricsContext.tsx   # Estado: FPS, cámara libre, SSAO
│   ├── tourCurves.ts        # Curvas Catmull-Rom para cámara (posición + target)
│   ├── tourDebugContext.tsx # Debug de posición/target/progreso
│   ├── tourScrollContext.tsx# Progreso del scroll (0..1), waypoints
│   └── waypoints.ts         # Definición de waypoints e inicialización
├── public/
│   ├── DeluxeVilla.glb      # Modelo 3D de la vivienda
│   ├── logo-gemdam.png      # Logo Gemdam
│   ├── pretoria_gardens_2k.hdr  # HDR para Environment
│   └── ...                  # Otros assets (SVG, etc.)
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Componentes Principales

### 5.1 Experience.tsx

- Orquestador del tour: proveedores de contexto, Canvas, UI.
- Registra `wheel` para scroll (con `passive: false`).
- Integra intro overlay y carga dinámica del modelo.
- Configuración del Canvas: `toneMapping`, `shadowMap`, `outputColorSpace`.

### 5.2 Scene.tsx

- Escala y centra el grupo del modelo en el mundo.
- Instancia `LightEnvironment`, `House`, `ContactShadows`.
- Opcionalmente aplica `EffectComposer` con `N8AO` (cuando `ssaoEnabled`).
- Parámetros configurables: `timeOfDay`, `sunRotation`, `webgpu`, `contactShadows`.

### 5.3 House.tsx

- Carga `DeluxeVilla.glb` vía `useGLTF`.
- Procesa materiales: vidrio/glass → `MeshPhysicalMaterial` con transmission; espejo → oculta malla original y usa `MirrorReplica`.
- Configura sombras: `castShadow`/`receiveShadow` según material.
- Marca materiales de vidrio con `userData.cannotReceiveAO` para excluirlos del SSAO.

### 5.4 ScrollTour.tsx

- Usa `getPositionCurve()` y `getTargetCurve()` para posicionar la cámara.
- Progreso `t` en `[0, 1)` con loop infinito.
- Interpolación suave con `damp()` hacia el `targetProgress` (waypoints) o hacia `progressRef` (scroll).
- Evita glitches al cruzar `1 → 0` en el loop.

### 5.5 MirrorReplica.tsx

- Crea un plano con `MeshReflectorMaterial` para simular reflejos.
- Sincroniza la matriz del plano con la malla de origen cada frame.
- Soporta rotación y offset para ajustar el reflejo al diseño del modelo.

### 5.6 LightEnvironment.tsx

- Posición del sol según `timeOfDay` (5 AM–9 PM) y `sunRotation`.
- Color e intensidad del sol basados en temperatura de color (aproximación Kelvin).
- `Environment` con HDR `pretoria_gardens_2k.hdr` como fondo e iluminación ambiental.

---

## 6. Flujo de Datos y Contextos

### 6.1 TourScrollContext

| Campo             | Tipo            | Descripción                                              |
|-------------------|-----------------|----------------------------------------------------------|
| `progress`        | number          | Progreso actual 0..1 (para UI)                           |
| `targetProgress`  | number \| null  | Destino al saltar a waypoint                             |
| `setTargetProgress` | (t) => void   | Establece destino para transición suave                  |
| `addDelta`        | (delta) => void | Añade delta de scroll (rueda)                            |
| `progressRef`     | MutableRefObject| Progreso interno (useFrame)                              |
| `targetProgressRef` | MutableRefObject | Target para animación                                 |

- `SCROLL_SPEED = 0.0004` controla la sensibilidad del scroll.

### 6.2 MetricsContext

| Campo          | Tipo    | Descripción                            |
|----------------|---------|----------------------------------------|
| `fps`          | number  | FPS actual                             |
| `freeCamera`   | boolean | Modo cámara libre (WASD) activo        |
| `ssaoEnabled`  | boolean | N8AO (postprocesado) activo            |
| `setFps`       | (fps) => void | Actualiza FPS                    |
| `setFreeCamera`| (v) => void   | Activa/desactiva cámara libre   |
| `setSsaoEnabled` | (v) => void | Activa/desactiva postprocesado |

### 6.3 TourDebugContext

- `infoRef`: referencia a posición, target y progreso de la cámara.
- `enabled` / `setEnabled`: visibilidad del overlay de debug.

---

## 7. Sistema de Cámara y Recorrido

### 7.1 Curvas Catmull-Rom (tourCurves.ts)

- **Posición**: 9 puntos que forman un loop cerrado; la cámara recorre 8 waypoints y vuelve al primero.
- **Target**: 9 puntos que definen el punto al que mira la cámara en cada tramo.
- Parámetro `t ∈ [0, 1)`; `closed: true` para loop sin discontinuidad.

### 7.2 Waypoints (waypoints.ts)

- 8 waypoints con `id`, `label` y `t` (posición en la curva).
- `INITIAL_CAMERA_POSITION` y `INITIAL_CAMERA_TARGET` para consistencia entre entornos.

### 7.3 Interpolación

- `damp(current, target, smoothing, dt)` para transiciones suaves.
- `DAMPING = 1.8` para seguir el scroll.
- `JUMP_EASE_SPEED = 0.8` para saltos a waypoints.

### 7.4 Modo Cámara Libre

- `PointerLockControls` + `FirstPersonMover` con WASD.
- `MOVE_SPEED = 0.01` por frame.
- Cuando está activo, `ScrollTour` no mueve la cámara.

---

## 8. Iluminación y Postprocesado

### 8.1 Iluminación

- **Ambient**: intensidad 0.02.
- **DirectionalLight**: posición dinámica, sombras 2048×2048, PCF soft shadows.
- **Environment**: HDR como background y reflexiones; intensidad variable según hora.

### 8.2 Postprocesado (N8AO)

- `EffectComposer` con `enableNormalPass`.
- `N8AO`: `aoRadius=0.20`, `intensity=5.0`, `quality="ultra"`.
- Los materiales de vidrio se excluyen mediante `userData.cannotReceiveAO`.

### 8.3 Controles de Iluminación

- **Time of Day**: 0–1 (5 AM–9 PM).
- **Sun Rotation**: 0–360°.
- Presets: Dawn, Morning, Brunch, Golden, Dusk.

---

## 9. Modelo 3D y Materiales

- **Formato**: GLB (glTF Binary).
- **Ruta**: `/DeluxeVilla.glb`.
- **Procesamiento**: detección de materiales por nombre (vidrio, espejo) y conversión a `MeshPhysicalMaterial` para vidrio; espejos reemplazados por `MirrorReplica`.

---

## 10. UI/UX

- **IntroOverlay**: pantalla de bienvenida; scroll o click para iniciar.
- **Logo Gemdam**: centrado arriba.
- **WaypointsUI**: puntos de recorrido; click salta al waypoint y vuelve a modo guiado si estaba en cámara libre.
- **TourBottomBar**: Vista libre, controles de iluminación, Postprocessing on/off.
- **MetricsOverlay**: FPS y métricas en esquina superior derecha.
- Estilos: glassmorphism, variables CSS, Tailwind.

---

## 11. Configuración

### 11.1 next.config.ts

- `reactStrictMode: false` para evitar doble montaje en desarrollo que afecta la posición inicial de la cámara.

### 11.2 tsconfig.json

- `target: ES2017`, `strict: true`.
- Path alias `@/*` → raíz del proyecto.
- `moduleResolution: bundler`, plugins de Next.js.

### 11.3 Scripts (package.json)

| Script  | Comando       | Descripción          |
|---------|---------------|----------------------|
| `dev`   | `next dev`    | Servidor desarrollo  |
| `build` | `next build`  | Build producción     |
| `start` | `next start`  | Servidor producción  |
| `lint`  | `eslint`      | Linting              |

---

## 12. Requisitos de Ejecución

- **Node.js** compatible con Next.js 16.
- Navegador con soporte WebGL 2.
- Resolución mínima recomendada: 1280×720.

---

## 13. Despliegue

- Compatible con **Vercel** y cualquier plataforma que soporte Next.js.
- El build genera una SPA híbrida; la experiencia 3D se carga como cliente (`"use client"`, `dynamic` con `ssr: false`).

---

*Documento técnico generado para informe del proyecto House Tour — Gemdam.*
