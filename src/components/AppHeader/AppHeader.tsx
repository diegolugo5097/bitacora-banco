import { Button } from '@/components/ui/Button/Button';
import type { LoadStatus } from '@/hooks/useTasks';
import { formatShortDate, todayIso } from '@/utils/date';
import styles from './AppHeader.module.css';

interface Props {
  status: LoadStatus;
  isShared: boolean;
  userName: string;
  onUserNameChange: (name: string) => void;
  canExport: boolean;
  onExport: () => void;
}

function syncLabel(status: LoadStatus, isShared: boolean): string {
  if (status === 'loading') return 'Conectando…';
  if (status === 'error') return 'Sin conexión con los datos';
  return isShared ? 'Compartido · cambios en vivo' : 'Solo en este navegador';
}

export function AppHeader({ status, isShared, userName, onUserNameChange, canExport, onExport }: Props) {
  const isLive = status === 'ready' && isShared;

  return (
    <header className={styles.header}>
      <div>
        <div className="eyebrow">Reporte de avances · corte {formatShortDate(todayIso())}</div>
        <h1 className={styles.title}>Bitácora de Avances</h1>
        <p className={styles.subtitle}>Tareas padre, sus tareas hijas y el porcentaje de cada una.</p>
      </div>

      <div className={styles.tools}>
        <span className={styles.sync} role="status">
          <i className={`${styles.dot} ${isLive ? styles.live : ''}`} />
          {syncLabel(status, isShared)}
        </span>
        <label className={styles.user}>
          <span className="eyebrow">Tu nombre</span>
          <input
            id="user-name"
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
            placeholder="Para firmar tus cambios"
            maxLength={60}
          />
        </label>
        <Button variant="primary" onClick={onExport} disabled={!canExport}>
          Exportar a Excel
        </Button>
      </div>
    </header>
  );
}
