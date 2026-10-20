import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ProgressSlider } from '@/components/ui/ProgressSlider/ProgressSlider';
import type { ParentTaskNode } from '@/domain/task.types';
import type { EditTarget, TaskFormSubmit, TaskKind } from './taskForm.types';
import { TaskTypeToggle } from './TaskTypeToggle';
import { useTaskForm } from './useTaskForm';
import styles from './TaskForm.module.css';

export type { EditTarget, TaskFormSubmit, TaskKind } from './taskForm.types';

interface Props {
  parents: ParentTaskNode[];
  editTarget: EditTarget | null;
  onSubmit: TaskFormSubmit;
  onCancelEdit: () => void;
}

function submitLabel(isEditing: boolean, kind: TaskKind): string {
  if (isEditing) return 'Guardar cambios';
  return kind === 'parent' ? 'Crear tarea padre' : 'Agregar tarea hija';
}

export function TaskForm({ parents, editTarget, onSubmit, onCancelEdit }: Props) {
  const parentIds = useMemo(() => parents.map((parent) => parent.id), [parents]);
  const form = useTaskForm(editTarget, parentIds);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = editTarget !== null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validate()) return;

    setIsSaving(true);
    const saved = await onSubmit({ kind: form.kind, parentId: form.parentId, draft: form.draft });
    setIsSaving(false);
    if (saved) form.reset();
  }

  return (
    <form className={`panel ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <div>
        <div className="eyebrow">{isEditing ? 'Editando' : 'Registrar'}</div>
        <h2>{isEditing ? 'Editar tarea' : 'Nueva tarea'}</h2>
      </div>

      {!isEditing && (
        <TaskTypeToggle value={form.kind} onChange={form.setKind} canCreateChild={parents.length > 0} />
      )}

      {form.kind === 'child' && !isEditing && (
        <label className={styles.field}>
          Pertenece a
          <select id="task-parent" value={form.parentId} onChange={(event) => form.setParentId(event.target.value)}>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={styles.field}>
        Nombre
        <input
          id="task-name"
          value={form.draft.name}
          onChange={(event) => form.updateField('name', event.target.value)}
          placeholder="Ej. Diseño de pantallas"
          maxLength={120}
        />
      </label>

      <label className={styles.field}>
        Descripción
        <textarea
          id="task-description"
          value={form.draft.description}
          onChange={(event) => form.updateField('description', event.target.value)}
          placeholder="Qué incluye la tarea"
        />
      </label>

      {form.kind === 'child' ? (
        <div className={styles.field}>
          Avance
          <ProgressSlider
            id="task-progress"
            label="Avance de la tarea"
            value={form.draft.progress}
            onChange={(value) => form.updateField('progress', value)}
          />
        </div>
      ) : (
        <p className={styles.note}>
          El avance de la tarea padre es el promedio de sus tareas hijas. Las fechas se registran solas: una tarea
          empieza al crearse y termina cuando llega al 100 %.
        </p>
      )}

      {form.error && (
        <p className={styles.error} role="alert">
          {form.error}
        </p>
      )}

      <div className={styles.buttons}>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {submitLabel(isEditing, form.kind)}
        </Button>
        {isEditing && <Button onClick={onCancelEdit}>Cancelar</Button>}
      </div>
    </form>
  );
}
