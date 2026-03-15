'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './BookingStepper.module.css';

const steps = [
  { path: '/booking/details', label: 'Dane gości', number: 1 },
  { path: '/booking/summary', label: 'Podsumowanie', number: 2 },
  { path: '/booking/payment', label: 'Płatność', number: 3 },
];

export default function BookingStepper() {
  const pathname = usePathname();

  const shouldShowStepper = 
    pathname.startsWith('/booking/details') ||
    pathname.startsWith('/booking/summary') ||
    pathname.startsWith('/booking/payment');

  if (!shouldShowStepper) {
    return null;
  }

  const getCurrentStep = () => {
    if (pathname.startsWith('/booking/details')) return 1;
    if (pathname.startsWith('/booking/summary')) return 2;
    if (pathname.startsWith('/booking/payment')) return 3;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className={styles.stepperContainer}>
      <div className={styles.stepper}>
        {steps.map((step) => (
          <div key={step.path} className={styles.stepWrapper}>
            <Link 
              href={step.path}
              className={`${styles.step} ${
                step.number === currentStep 
                  ? styles.active 
                  : step.number < currentStep 
                    ? styles.completed 
                    : ''
              }`}
              onClick={(e) => {
                if (step.number > currentStep) {
                  e.preventDefault();
                }
              }}
            >
              <span className={styles.stepNumber}>{step.number}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </Link>
            {step.number < steps.length && (
              <span className={`${styles.connector} ${step.number < currentStep ? styles.connectorActive : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}