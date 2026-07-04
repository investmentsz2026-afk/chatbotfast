'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { QuickOption } from '@/types';
import styles from './QuickActions.module.css';

interface QuickActionsProps {
  options: QuickOption[];
  onSelect: (option: QuickOption) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 7v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  location: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  help: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor"/>
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function QuickActions({ options, onSelect }: QuickActionsProps) {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {options.map((option, i) => (
        <motion.button
          key={option.id}
          className={`${styles.button} ${styles[option.variant || 'secondary']}`}
          onClick={() => onSelect(option)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          id={`quick-action-${option.id}`}
        >
          {option.icon && ICONS[option.icon] && (
            <span className={styles.icon}>{ICONS[option.icon]}</span>
          )}
          {option.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
