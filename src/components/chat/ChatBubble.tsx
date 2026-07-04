'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import styles from './ChatBubble.module.css';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  index?: number;
}

export default function ChatBubble({ role, content, isStreaming, index = 0 }: ChatBubbleProps) {
  const isBot = role === 'assistant';

  return (
    <motion.div
      className={`${styles.container} ${isBot ? styles.bot : styles.user}`}
      initial={{ opacity: 0, y: 12, x: isBot ? -12 : 12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.05, 0.2),
      }}
    >
      {isBot && (
        <div className={styles.avatarCol}>
          <div className={styles.avatar} style={{ overflow: 'hidden' }}>
            <img src="/logo.jpeg" alt="Logo Alerta Violeta" width="32" height="32" style={{ objectFit: 'cover' }} />
          </div>
        </div>
      )}

      <div className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser}`}>
        {isBot ? (
          isStreaming && !content ? (
            <div className={styles.dots}>
              <span className={styles.dot} style={{ animationDelay: '0ms' }} />
              <span className={styles.dot} style={{ animationDelay: '200ms' }} />
              <span className={styles.dot} style={{ animationDelay: '400ms' }} />
            </div>
          ) : (
            <div className={styles.markdownContent}>
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )
        ) : (
          <p>{content}</p>
        )}
        {isStreaming && content && (
          <span className={styles.cursor}>▊</span>
        )}
      </div>
    </motion.div>
  );
}
