import { formatShortDate } from '@/utils/date';

interface Props {
  startDate: string;
  endDate: string;
  isOpen: boolean;
}

/** "Desde 12 oct" mientras está abierta; "12 oct → 15 oct" cuando se completó. */
export function TaskDates({ startDate, endDate, isOpen }: Props) {
  if (isOpen) return <>Desde {formatShortDate(startDate)}</>;
  return (
    <>
      {formatShortDate(startDate)} → {formatShortDate(endDate)}
    </>
  );
}
