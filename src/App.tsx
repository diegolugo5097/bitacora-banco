import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader/AppHeader';
import { GanttChart } from '@/components/GanttChart/GanttChart';
import { LocalImportBanner } from '@/components/LocalImportBanner/LocalImportBanner';
import { SummaryBar } from '@/components/SummaryBar/SummaryBar';
import { TaskForm, type EditTarget, type TaskFormSubmit } from '@/components/TaskForm/TaskForm';
import { TaskList } from '@/components/TaskList/TaskList';
import { Toast } from '@/components/ui/Toast/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocalImport } from '@/hooks/useLocalImport';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/useToast';
import styles from './App.module.css';

export default function App() {
  const { userName, setUserName } = useCurrentUser();
  const tasks = useTasks(userName);
  const { toastMessage, showToast } = useToast();
  const localImport = useLocalImport();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

  /** Ejecuta una acción de datos y avisa al usuario si funcionó o no. */
  async function run(action: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    try {
      await action();
      showToast(successMessage);
      return true;
    } catch {
      showToast('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.');
      return false;
    }
  }

  const handleSubmit: TaskFormSubmit = async ({ kind, parentId, draft }) => {
    if (editTarget?.kind === 'parent') {
      const saved = await run(() => tasks.updateParent(editTarget.task.id, draft), 'Cambios guardados');
      if (saved) setEditTarget(null);
      return saved;
    }
    if (editTarget?.kind === 'child') {
      const saved = await run(() => tasks.updateChild(editTarget.task.id, draft), 'Cambios guardados');
      if (saved) setEditTarget(null);
      return saved;
    }
    if (kind === 'parent') return run(() => tasks.createParent(draft), 'Tarea padre creada');

    expandParent(parentId);
    return run(() => tasks.createChild(parentId, draft), 'Tarea hija agregada');
  };

  /** La librería de Excel se descarga solo la primera vez que alguien exporta. */
  async function exportToExcel() {
    try {
      const { exportProgressReport } = await import('@/services/excelExport');
      await exportProgressReport(tasks.tree);
    } catch {
      showToast('No se pudo generar el Excel. Intenta de nuevo.');
    }
  }

  function startEditing(target: EditTarget) {
    setEditTarget(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function expandParent(parentId: string) {
    setCollapsedParents((current) => {
      const next = new Set(current);
      next.delete(parentId);
      return next;
    });
  }

  function toggleParent(parentId: string) {
    setCollapsedParents((current) => {
      const next = new Set(current);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <AppHeader
        status={tasks.status}
        isShared={tasks.isShared}
        userName={userName}
        onUserNameChange={setUserName}
        canExport={tasks.tree.length > 0}
        onExport={exportToExcel}
      />

      {localImport.isVisible && (
        <LocalImportBanner
          parentCount={localImport.parentCount}
          childCount={localImport.childCount}
          isImporting={localImport.isImporting}
          onImport={() => run(localImport.importLocalTasks, 'Tareas pasadas a la lista compartida')}
          onDismiss={localImport.dismiss}
        />
      )}

      <SummaryBar summary={tasks.summary} />

      <div className={styles.workbench}>
        <TaskForm
          parents={tasks.tree}
          editTarget={editTarget}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditTarget(null)}
        />
        <TaskList
          tree={tasks.tree}
          status={tasks.status}
          collapsedParents={collapsedParents}
          onToggleParent={toggleParent}
          onEditParent={(task) => startEditing({ kind: 'parent', task })}
          onDeleteParent={(id) => run(() => tasks.deleteParent(id), 'Tarea padre eliminada')}
          onEditChild={(task) => startEditing({ kind: 'child', task })}
          onDeleteChild={(id) => run(() => tasks.deleteChild(id), 'Tarea hija eliminada')}
          onChildProgressChange={(id, progress) =>
            tasks.updateChildProgress(id, progress).catch(() => showToast('No se pudo guardar el avance.'))
          }
          onChildJustificationChange={(id, text) =>
            tasks
              .updateChildJustification(id, text)
              .then(() => showToast('Justificación guardada'))
              .catch(() => showToast('No se pudo guardar la justificación.'))
          }
        />
      </div>

      <GanttChart tree={tasks.tree} />

      <Toast message={toastMessage} />
    </div>
  );
}
