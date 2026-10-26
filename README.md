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
│   ├── progress.ts        Avance, cumplimiento, línea de tiempo, árbol padre → hijas, resumen
│   └── validation.ts      Validación del formulario
├── data/              Persistencia detrás de una interfaz
│   ├── TaskRepository.ts      Contrato que usa la app
│   ├── localTaskRepository.ts Navegador (localStorage, sincroniza pestañas)
│   ├── localTaskStorage.ts    Lectura/escritura local y conversión de datos de versiones anteriores
│   ├── firestoreTaskRepository.ts  Firebase en tiempo real
│   └── index.ts               Elige la implementación según el .env
├── context/           Inyección del repositorio con React Context
├── hooks/             useTasks, useLocalImport, useCurrentUser, useToast, useDebouncedCallback
├── services/          progressWorkbook.ts (arma el Excel con ExcelJS) y excelExport.ts (lo descarga)
├── components/
│   ├── AppHeader/         Título, estado de sincronización, nombre, exportar
│   ├── SummaryBar/        Indicadores generales
│   ├── TaskForm/          Formulario (crear / editar) + hook useTaskForm
│   ├── LocalImportBanner/ Aviso para pasar tareas locales a la lista compartida
│   ├── TaskList/          TaskList → ParentTaskCard → ChildTaskRow (+ JustificationField)
│   ├── GanttChart/        Gantt, filas, leyenda y cálculo de escala
│   └── ui/                Button, StatusChip, ComplianceChip, ProgressBar, ProgressSlider,
│                          RowActions, UpdatedBy, EmptyState, Toast
├── utils/             Fechas, ids y color de avance (progressColor.ts)
└── styles/            Tokens de diseño y estilos globales
```

### Decisiones

- **Dominio sin dependencias de UI:** `progress.ts` se puede probar con cualquier runner de tests.
- **Repositorio intercambiable:** la UI solo conoce `TaskRepository`. Para usar tu propio
  backend (por ejemplo una API REST), implementa esa interfaz y cámbiala en `data/index.ts`.
- **Una tarea, un documento:** dos personas pueden editar tareas distintas a la vez sin pisarse.
- **Fechas:** la tarea padre tiene fecha de inicio y cada hija una fecha final. La fecha en que
  una hija llega al 100 % se registra sola.
- **Cumplimiento de las hijas** (se calcula, nadie lo marca a mano):
  - *Cumplida:* llegó al 100 % a más tardar en su fecha final.
  - *No cumplida:* se venció sin terminar, o se terminó después de la fecha final.
    Lleva margen roja, un cuadro de justificación y, en el Gantt, un tramo rayado con el retraso.
  - *En plazo:* todavía no vence.
- **Color de avance:** de gris (0 %) a verde (100 %), con `color-mix` en CSS (`.progress-tone`).
  El Excel usa la misma escala desde `utils/progressColor.ts`.
- **Avance de la padre:** promedio simple de sus hijas.
- **Excel:** hojas *Resumen* y *Detalle* con fechas, avance coloreado, cumplimiento y justificación.
  Las filas no cumplidas llevan margen roja. ExcelJS se descarga solo al exportar.
- **Slider con espera:** el avance se guarda 450 ms después de soltar el control,
  no en cada paso.
