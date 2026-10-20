import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}
