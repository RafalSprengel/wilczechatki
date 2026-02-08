import React, { forwardRef } from 'react';
import styles from './HamburgerButton.module.css';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  ({ isOpen, onClick, className }, ref) => {
    const handleOnclick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick();
    };

    return (
      <button
        className={`${styles.hamburger} ${isOpen ? styles.isOpen : ''} ${className}`}
        onClick={handleOnclick}
        aria-label="Toggle menu"
        ref={ref}
      >
        <div className={styles.bar}></div>
        <div className={styles.bar}></div>
        <div className={styles.bar}></div>
      </button>
    );
  }
);

HamburgerButton.displayName = 'HamburgerButton';

export default HamburgerButton;