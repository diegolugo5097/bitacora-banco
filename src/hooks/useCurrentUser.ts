import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bitacora-avances:usuario';

function readName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Nombre con el que se firman los cambios ("Actualizado por …"). */
export function useCurrentUser() {
  const [userName, setUserName] = useState(readName);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, userName);
    } catch {
      // Sin almacenamiento disponible: el nombre vale solo para esta sesión.
    }
  }, [userName]);

  return { userName, setUserName };
}
