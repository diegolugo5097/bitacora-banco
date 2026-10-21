import { Button } from '@/components/ui/Button/Button';
import styles from './LocalImportBanner.module.css';

interface Props {
  parentCount: number;
  childCount: number;
  isImporting: boolean;
  onImport: () => void;
  onDismiss: () => void;
}

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`;

export function LocalImportBanner({ parentCount, childCount, isImporting, onImport, onDismiss }: Props) {
  const parents = plural(parentCount, 'tarea padre', 'tareas padre');
  const children = childCount > 0 ? ` con ${plural(childCount, 'hija', 'hijas')}` : '';

  return (
    <div className={styles.banner} role="region" aria-label="Tareas guardadas en este navegador">
      <div className={styles.text}>
        <strong>
          Tienes {parents}
          {children} guardadas solo en este navegador.
        </strong>
        <span>Pásalas a la lista compartida para que el resto del equipo también las vea.</span>
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={onImport} disabled={isImporting}>
          {isImporting ? 'Pasando tareas…' : 'Pasarlas a la lista compartida'}
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={isImporting}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}
