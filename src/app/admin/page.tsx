'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KnowledgeDocumentData } from '@/types';
import dynamic from 'next/dynamic';
import ThemeToggle from '@/components/chat/ThemeToggle';
import { processUploadedFileAction } from './actions';
import { upload } from '@vercel/blob/client';
import styles from './admin.module.css';

// Separate content component to wrap in dynamic import with ssr: false
function AdminPageContent() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Sidebar state for mobile hamburger menu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'knowledge' | 'profile'>('knowledge');

  // Documents State
  const [documents, setDocuments] = useState<KnowledgeDocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sourceType, setSourceType] = useState<'text' | 'link' | 'file'>('text');
  
  // Text Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  
  // File fields
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to physical keyboard events
  useEffect(() => {
    if (!mounted || isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          setPin((prev) => [...prev, e.key]);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, isAuthenticated, pin]);

  // Auto-submit PIN when it reaches 6 digits
  useEffect(() => {
    if (pin.length === 6) {
      submitPin(pin.join(''));
    }
  }, [pin]);

  const submitPin = async (enteredPin: string) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: enteredPin }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError('Contraseña incorrecta');
        setPin([]); // reset PIN
        setTimeout(() => setAuthError(''), 3000);
      }
    } catch {
      setAuthError('Error de conexión');
      setPin([]);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => [...prev, num]);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      console.error('Error fetching documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (sourceType === 'file') {
        if (!file) {
          setMessage({ type: 'error', text: 'Por favor, selecciona un archivo' });
          setSubmitting(false);
          return;
        }

        // 1. Upload to Vercel Blob directly from the browser (bypasses Vercel 4.5MB limit)
        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });

        // 2. Call the server action with the blob URL to process the PDF and save to DB
        const data = await processUploadedFileAction(newBlob.url, file.name, description);

        if (data.success) {
          setMessage({
            type: 'success',
            text: `Archivo "${file.name}" cargado con éxito. Se crearon ${data.document?.chunksCount || 0} fragmentos.`,
          });
          setFile(null);
          setDescription('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          setShowForm(false);
          fetchDocuments();
        } else {
          setMessage({ type: 'error', text: data.error || 'Error al subir archivo' });
        }
      } else {
        if (!title.trim()) {
          setMessage({ type: 'error', text: 'Se requiere un título' });
          setSubmitting(false);
          return;
        }

        const payload = {
          title,
          sourceType,
          sourceUrl: sourceType === 'link' ? sourceUrl : '',
          content: sourceType === 'link' ? `Enlace de referencia: ${sourceUrl}` : content,
        };

        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
          setMessage({
            type: 'success',
            text: `Documento "${title}" guardado con ${data.document.chunksCount} fragmentos.`,
          });
          setTitle('');
          setContent('');
          setSourceUrl('');
          setShowForm(false);
          fetchDocuments();
        } else {
          setMessage({ type: 'error', text: data.error || 'Error al guardar' });
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Ocurrió un error al procesar la solicitud' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    setConfirmModal({ id, title: docTitle });
  };

  const executeDelete = async () => {
    if (!confirmModal) return;
    const { id, title: docTitle } = confirmModal;
    setConfirmModal(null);

    try {
      const res = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Documento "${docTitle}" eliminado.` });
        fetchDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al eliminar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de red al eliminar' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin([]);
    setIsSidebarOpen(false);
  };

  const handleTabChange = (tab: 'knowledge' | 'profile') => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting tab
  };

  // Render Loader during Hydration (should not be triggered with ssr: false, but safe fallback)
  if (!mounted) {
    return (
      <div className={styles.loadingState} style={{ height: '100dvh', justifyContent: 'center' }}>
        <div className={styles.spinner} />
        <p>Cargando panel...</p>
      </div>
    );
  }

  // --- LOCK SCREEN DESIGN ---
  if (!isAuthenticated) {
    return (
      <div className={styles.lockContainer}>
        {/* Floating Incorrect PIN notification */}
        <AnimatePresence>
          {authError && (
            <motion.div
              className={styles.errorBanner}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <a href="/" className={styles.backToChatLock}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al Chat
        </a>

        <motion.div
          className={styles.lockCard}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.lockHeader}>
            <div className={styles.lockIconContainer}>
              <img src="/logo.jpeg" alt="Logo Alerta Violeta" width="48" height="48" style={{ borderRadius: '50%' }} />
            </div>
            <h1 className={styles.lockTitle}>ALERTA VIOLETA</h1>
            <p className={styles.lockSubtitle}>Introduce el PIN de acceso de 6 dígitos</p>
          </div>

          {/* Dots Indicator */}
          <div className={styles.dotsContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i < pin.length ? styles.dotFilled : ''}`}
              />
            ))}
          </div>

          {/* Numerical Dial Pad */}
          <div className={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                className={styles.keypadButton}
                onClick={() => handleKeyPress(num)}
                disabled={authLoading}
              >
                {num}
              </button>
            ))}
            <div className={styles.keypadSpacer} />
            <button
              type="button"
              className={styles.keypadButton}
              onClick={() => handleKeyPress('0')}
              disabled={authLoading}
            >
              0
            </button>
            <button
              type="button"
              className={styles.keypadButtonDelete}
              onClick={handleBackspace}
              disabled={authLoading || pin.length === 0}
              title="Borrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M18 9l-6 6M12 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- ADMIN PORTAL SIDEBAR DESIGN ---
  return (
    <div className={styles.portalContainer}>
      {/* Sidebar - sliding on mobile based on isSidebarOpen */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img src="/logo.jpeg" alt="Logo Alerta Violeta" className={styles.sidebarLogo} />
          <div>
            <h2 className={styles.sidebarAppName}>ALERTA VIOLETA</h2>
            <span className={styles.sidebarBadge}>Administrador</span>
          </div>
          {/* Close button for mobile */}
          <button className={styles.sidebarCloseButton} onClick={() => setIsSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'knowledge' ? styles.navItemActive : ''}`}
            onClick={() => handleTabChange('knowledge')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20M4 19.5V5a2.5 2.5 0 012.5-2.5H20v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Base de Datos</span>
          </button>
          
          <button
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Perfil</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay on mobile */}
      {isSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className={styles.portalContent}>
        {/* Header */}
        <header className={styles.portalHeader}>
          <div className={styles.portalHeaderLeft}>
            {/* Hamburger Button for mobile */}
            <button className={styles.hamburgerButton} onClick={() => setIsSidebarOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <a href="/" className={styles.backLinkPortal} title="Volver al Chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Volver al Chat</span>
            </a>
          </div>
          
          <div className={styles.portalHeaderRight} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ThemeToggle />
            {activeTab === 'knowledge' && (
              <button
                className={styles.addButtonPortal}
                onClick={() => setShowForm(!showForm)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Cargar Información</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className={styles.portalBody}>
          <AnimatePresence mode="wait">
            {activeTab === 'knowledge' ? (
              <motion.div
                key="knowledge-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Form to load content */}
                <AnimatePresence>
                  {showForm && (
                    <motion.form
                      className={styles.form}
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Tipo de fuente</label>
                          <select
                            className={styles.input}
                            value={sourceType}
                            onChange={(e) => setSourceType(e.target.value as any)}
                          >
                            <option value="text">Pegar Texto</option>
                            <option value="file">Subir Archivo (PDF, Imagen)</option>
                            <option value="link">Enlace Web</option>
                          </select>
                        </div>

                        {sourceType !== 'file' && (
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Título del documento</label>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Derechos de las víctimas"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>

                      {sourceType === 'link' && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>URL de la fuente</label>
                          <input
                            type="url"
                            className={styles.input}
                            placeholder="https://..."
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {sourceType === 'text' && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Contenido de texto</label>
                          <textarea
                            className={styles.textarea}
                            placeholder="Pega aquí el contenido a registrar en el chatbot..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            required
                          />
                        </div>
                      )}

                      {sourceType === 'file' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Seleccionar Archivo (PDF o Imagen)</label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className={styles.input}
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt"
                              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Descripción / Resumen (Opcional)</label>
                            <textarea
                              className={styles.textarea}
                              placeholder="Describe de qué trata el archivo..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.cancelButton}
                          onClick={() => setShowForm(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className={styles.submitButton}
                          disabled={submitting}
                        >
                          {submitting ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Toast Notification */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      className={`${styles.toast} ${styles[message.type]}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List of Documents */}
                <div className={styles.documentsSection}>
                  <h2 className={styles.sectionTitle}>
                    Base de Conocimiento
                    <span className={styles.badge}>{documents.length}</span>
                  </h2>

                  {loading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.spinner} />
                      <p>Cargando documentos...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📚</div>
                      <h3>Sin documentos aún</h3>
                      <p>Agrega información para alimentar al chatbot.</p>
                    </div>
                  ) : (
                    <div className={styles.documentsList}>
                      {documents.map((doc) => (
                        <div key={doc.id} className={styles.documentCard}>
                          <div className={styles.documentInfo}>
                            <div className={styles.documentIcon}>
                              {doc.sourceType === 'pdf' ? '📕' :
                               doc.sourceType === 'image' ? '🖼️' :
                               doc.sourceType === 'link' ? '🔗' : '📝'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 className={styles.documentTitle}>{doc.title}</h3>
                                {doc.sourceUrl && (
                                  <a
                                    href={doc.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fileLink}
                                    title="Ver archivo original"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>Ver</span>
                                  </a>
                                )}
                              </div>
                              <div className={styles.documentMeta}>
                                <span>{doc.chunksCount} fragmentos</span>
                                <span>•</span>
                                <span>{new Date(doc.createdAt).toLocaleDateString('es-PE')}</span>
                                <span>•</span>
                                <span className={styles.sourceTag}>{doc.sourceType}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(doc.id, doc.title)}
                            title="Eliminar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile-tab"
                className={styles.profileSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.profileCard}>
                  <div className={styles.profileAvatarContainer}>
                    <img src="/logo.jpeg" alt="Logo Alerta Violeta" className={styles.profileAvatar} />
                    <div className={styles.profileDot} />
                  </div>
                  <h2 className={styles.profileName}>ALERTA VIOLETA DEMO</h2>
                  <p className={styles.profileRole}>Sistema Inteligente de Apoyo y Protección</p>
                  
                  <div className={styles.profileDivider} />
                  
                  <div className={styles.profileStats}>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Versión de la App</span>
                      <span className={styles.statValue}>1.0.0 (PWA)</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Base de Datos</span>
                      <span className={styles.statValue} style={{ color: '#22c55e' }}>Conectado (PostgreSQL)</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Modelo de IA</span>
                      <span className={styles.statValue}>Llama 3.3 70B (Groq)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal && (
            <div className={styles.modalOverlay}>
              <motion.div
                className={styles.modalContent}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.modalHeader}>
                  <div className={styles.modalIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v2M12 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Confirmar Eliminación</h3>
                </div>
                
                <div className={styles.modalBody}>
                  <p>¿Estás seguro de que deseas eliminar el documento <strong>"{confirmModal.title}"</strong> y todos sus fragmentos?</p>
                  <p className={styles.modalWarning}>Esta acción no se puede deshacer.</p>
                </div>
                
                <div className={styles.modalActions}>
                  <button 
                    className={styles.cancelButton} 
                    onClick={() => setConfirmModal(null)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className={styles.confirmDeleteBtn} 
                    onClick={executeDelete}
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Export page wrapped in Next.js dynamic without SSR to eliminate hydration mismatch forever
const AdminPage = dynamic(() => Promise.resolve(AdminPageContent), {
  ssr: false,
});

export default AdminPage;
