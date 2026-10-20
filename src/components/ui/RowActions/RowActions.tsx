import { useState } from 'react';
import { Button } from '../Button/Button';
import styles from './RowActions.module.css';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  /** Pregunta que se muestra antes de eliminar. */
  confirmMessage: string;
}

/** Botones Editar / Eliminar con confirmación en línea antes de borrar. */
export function RowActions({ onEdit, onDelete, confirmMessage }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <span className={styles.confirm}>
        {confirmMessage}
        <Button variant="danger" onClick={onDelete}>
          Sí
        </Button>
        <Button variant="ghost" onClick={() => setIsConfirming(false)}>
          No
        </Button>
      </span>
    );
  }

  return (
    <span className={styles.actions}>
      <Button variant="ghost" onClick={onEdit}>
        Editar
      </Button>
      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        Eliminar
      </Button>
    </span>
  );
}
