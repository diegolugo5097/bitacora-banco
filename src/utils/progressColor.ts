import type { CSSProperties } from 'react';

/** Mismos valores que `--progress-empty` y `--progress-full` del tema claro (styles/global.css). */
export const PROGRESS_EMPTY_HEX = '#a0a0a0';
export const PROGRESS_FULL_HEX = '#1e8e3e';

const toRgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

/** Color hexadecimal entre gris (0 %) y verde (100 %), igual a la mezcla que hace el CSS. */
export function progressHex(progress: number): string {
  const ratio = Math.min(100, Math.max(0, progress)) / 100;
  const empty = toRgb(PROGRESS_EMPTY_HEX);
  const full = toRgb(PROGRESS_FULL_HEX);
  return (
    '#' +
    empty
      .map((channel, index) => Math.round(channel + (full[index] - channel) * ratio))
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Estilo para elementos con la clase `progress-tone`. */
export function progressStyle(progress: number): CSSProperties {
  return { '--progress': progress } as CSSProperties;
}
