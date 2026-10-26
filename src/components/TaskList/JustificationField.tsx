import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import styles from './TaskList.module.css';

/** Espera tras dejar de escribir antes de guardar. */
const SAVE_DELAY_MS = 900;

interface Props {
  taskId: string;
  value: string;
  onSave: (text: string) => void;
}

/** Cuadro de justificación para una tarea no cumplida. Se guarda solo. */
export function JustificationField({ taskId, value, onSave }: Props) {
  const [draft, setDraft] = useState(value);
  const isEditing = useRef(false);
  const lastSaved = useRef(value);

  const save = (text: string) => {
    if (text.trim() === lastSaved.current.trim()) return;
    lastSaved.current = text;
    onSave(text);
  };
  const saveLater = useDebouncedCallback(save, SAVE_DELAY_MS);

  // Si otra persona escribe la justificación, se refleja aquí salvo que este usuario esté escribiendo.
  useEffect(() => {
    if (isEditing.current) return;
    setDraft(value);
    lastSaved.current = value;
  }, [value]);

  const isMissing = draft.trim() === '';
  const fieldId = `justification-${taskId}`;

  return (
    <div className={styles.justification}>
      <label htmlFor={fieldId} className={styles.justificationLabel}>
        Justificación
        {isMissing && <span className={styles.missing}>Pendiente</span>}
      </label>
      <textarea
        id={fieldId}
        value={draft}
        rows={2}
        maxLength={1000}
        placeholder="¿Por qué no se cumplió a tiempo? Ej. dependía de la aprobación del área de riesgos."
        onFocus={() => (isEditing.current = true)}
        onChange={(event) => {
          setDraft(event.target.value);
          saveLater(event.target.value);
        }}
        onBlur={() => {
          isEditing.current = false;
          save(draft);
        }}
      />
    </div>
  );
}
