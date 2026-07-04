'use client';

import { motion } from 'framer-motion';
import styles from './TypingIndicator.module.css';

export default function TypingIndicator() {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.avatarCol}>
        <div className={styles.avatar} style={{ overflow: 'hidden' }}>
          <img src="/logo.jpeg" alt="Logo Alerta Violeta" width="32" height="32" style={{ objectFit: 'cover' }} />
        </div>
      </div>
      <div className={styles.bubble}>
        <div className={styles.dots}>
          <span className={styles.dot} style={{ animationDelay: '0ms' }} />
          <span className={styles.dot} style={{ animationDelay: '200ms' }} />
          <span className={styles.dot} style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </motion.div>
  );
}
