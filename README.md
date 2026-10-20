# Bitácora de Avances

Sistema de reportes de avance: tareas padre con tareas hijas, porcentaje por tarea,
diagrama de Gantt y exportación a Excel. React 18 + TypeScript + Vite.

## Empezar

```bash
npm install
npm run dev
```

Sin configuración, las tareas se guardan en el navegador (modo local).

## Compartir en vivo con el equipo (Firebase)

1. Crea un proyecto en Firebase y activa **Cloud Firestore**.
2. Registra una app web y copia su configuración.
3. Copia `.env.example` a `.env` y completa los valores `VITE_FIREBASE_*`.
4. Reinicia `npm run dev`. El encabezado mostrará "Compartido · cambios en vivo".

Las tareas quedan en las colecciones `parentTasks` y `childTasks`. Antes de publicar,
configura las reglas de seguridad de Firestore (por ejemplo, exigir usuarios autenticados).

## Estructura

```
src/
├── domain/            Reglas de negocio puras, sin React
│   ├── task.types.ts      Tipos del dominio
│   ├── progress.ts        Avance ponderado, estados, árbol padre → hijas, resumen
│   └── validation.ts      Validación del formulario
├── data/              Persistencia detrás de una interfaz
│   ├── TaskRepository.ts      Contrato que usa la app
│   ├── localTaskRepository.ts Navegador (localStorage, sincroniza pestañas)
│   ├── firestoreTaskRepository.ts  Firebase en tiempo real
│   └── index.ts               Elige la implementación según el .env
├── context/           Inyección del repositorio con React Context
├── hooks/             useTasks, useCurrentUser, useToast, useDebouncedCallback
├── services/          excelExport.ts (SheetJS)
├── components/
│   ├── AppHeader/         Título, estado de sincronización, nombre, exportar
│   ├── SummaryBar/        Indicadores generales
│   ├── TaskForm/          Formulario (crear / editar) + hook useTaskForm
│   ├── TaskList/          TaskList → ParentTaskCard → ChildTaskRow
│   ├── GanttChart/        Gantt, filas, leyenda y cálculo de escala
│   └── ui/                Button, StatusChip, ProgressBar, ProgressSlider,
│                          RowActions, UpdatedBy, EmptyState, Toast
├── utils/             Fechas e ids
└── styles/            Tokens de diseño y estilos globales
```

### Decisiones

- **Dominio sin dependencias de UI:** `progress.ts` se puede probar con cualquier runner de tests.
- **Repositorio intercambiable:** la UI solo conoce `TaskRepository`. Para usar tu propio
  backend (por ejemplo una API REST), implementa esa interfaz y cámbiala en `data/index.ts`.
- **Una tarea, un documento:** dos personas pueden editar tareas distintas a la vez sin pisarse.
- **Fechas automáticas:** nadie escribe fechas. Una tarea empieza cuando se crea y termina
  cuando su avance llega al 100 % (si baja de 100 %, vuelve a quedar abierta). Las tareas
  abiertas se dibujan en el Gantt hasta hoy, con el borde final punteado.
- **Avance de la padre:** promedio simple de sus hijas.
- **Estados:** Completada, En curso y Sin iniciar.
- **Slider con espera:** el avance se guarda 450 ms después de soltar el control,
  no en cada paso.
