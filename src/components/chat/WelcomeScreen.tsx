'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConversationState } from '@/types';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onSelectRole: (role: 'victim' | 'witness') => void;
  onStartChat: () => void;
}

export default function WelcomeScreen({ onSelectRole, onStartChat }: WelcomeScreenProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      {/* Animated background orbs */}
      <div className={styles.orbContainer}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Bot Avatar */}
        <motion.div
          className={styles.avatarContainer}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className={styles.avatar}>
            <div className={styles.avatarInner} style={{ overflow: 'hidden' }}>
              <img src="/logo.jpeg" alt="Logo Alerta Violeta" width="64" height="64" style={{ objectFit: 'cover' }} />
            </div>
          </div>
          <div className={styles.avatarPulse} />
        </motion.div>

        {/* Title */}
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="gradient-text">ALERTA VIOLETA DEMO</span>
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Estoy aquí para orientarte y ayudarte. Selecciona una opción para comenzar.
        </motion.p>

        {/* Role Selection */}
        <motion.div
          className={styles.optionsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className={`${styles.optionCard} ${hoveredOption === 'victim' ? styles.optionCardActive : ''}`}
            onClick={() => onSelectRole('victim')}
            onMouseEnter={() => setHoveredOption('victim')}
            onMouseLeave={() => setHoveredOption(null)}
            id="btn-victim-role"
          >
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h3 className={styles.optionTitle}>Soy víctima de agresión</h3>
            <p className={styles.optionDesc}>Necesito ayuda inmediata y orientación</p>
            <div className={styles.optionArrow}>→</div>
          </button>

          <button
            className={`${styles.optionCard} ${hoveredOption === 'witness' ? styles.optionCardActive : ''}`}
            onClick={() => onSelectRole('witness')}
            onMouseEnter={() => setHoveredOption('witness')}
            onMouseLeave={() => setHoveredOption(null)}
            id="btn-witness-role"
          >
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
            <h3 className={styles.optionTitle}>Soy testigo de agresión</h3>
            <p className={styles.optionDesc}>Quiero reportar lo que he presenciado</p>
            <div className={styles.optionArrow}>→</div>
          </button>
        </motion.div>

        {/* General Chat Option */}
        <motion.button
          className={styles.generalChatBtn}
          onClick={onStartChat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          id="btn-general-chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          O escribe tu consulta directamente
        </motion.button>
      </motion.div>
    </div>
  );
}
