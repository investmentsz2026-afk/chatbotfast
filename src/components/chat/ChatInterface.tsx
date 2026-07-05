'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence } from 'framer-motion';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';
import LocationSelector from './LocationSelector';
import WelcomeScreen from './WelcomeScreen';
import ThemeToggle from './ThemeToggle';
import type { ConversationState, QuickOption, DepartmentData, ProvinceData, DistrictData, PoliceStationData } from '@/types';
import styles from './ChatInterface.module.css';

const INITIAL_STATE: ConversationState = {
  step: 'initial',
};

export default function ChatInterface() {
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_STATE);
  const [showWelcome, setShowWelcome] = useState(true);
  const [stations, setStations] = useState<PoliceStationData[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickExit = useCallback(() => {
    // Mask user activity immediately by replacing browser history with google.com
    window.location.replace('https://www.google.com');
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversationState,
      },
    }),
    onFinish: () => {
      scrollToBottom();
    },
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // --- Handlers ---

  const handleSelectRole = useCallback(async (role: 'victim' | 'witness') => {
    setShowWelcome(false);
    const roleText = role === 'victim' ? 'Soy víctima de agresión' : 'Soy testigo de agresión';

    setConversationState({
      step: 'select_department',
      role,
    });

    // Add user message and bot response
    setMessages([
      {
        id: 'user-role',
        role: 'user',
        parts: [{ type: 'text', text: roleText }],
      },
      {
        id: 'bot-location',
        role: 'assistant',
        parts: [{
          type: 'text',
          text: role === 'victim'
            ? 'Entiendo tu situación y quiero ayudarte. Para encontrar la comisaría más cercana, necesito saber tu ubicación. **¿En qué departamento te encuentras?**'
            : 'Gracias por reportar. Te ayudaré a encontrar la comisaría más cercana. **¿En qué departamento ocurrió el incidente?**'
        }],
      },
    ]);
  }, [setMessages]);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
    setConversationState({ step: 'general_chat' });
  }, []);

  const handleSelectDepartment = useCallback((dept: DepartmentData) => {
    setConversationState((prev) => ({
      ...prev,
      step: 'select_province',
      departmentId: dept.id,
      departmentName: dept.name,
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `user-dept-${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: dept.name }],
      },
      {
        id: `bot-prov-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `Perfecto, **${dept.name}**. Ahora selecciona tu **provincia**.` }],
      },
    ]);
  }, [setMessages]);

  const handleSelectProvince = useCallback((prov: ProvinceData) => {
    setConversationState((prev) => ({
      ...prev,
      step: 'select_district',
      provinceId: prov.id,
      provinceName: prov.name,
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `user-prov-${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: prov.name }],
      },
      {
        id: `bot-dist-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `Provincia **${prov.name}**. Ahora selecciona tu **distrito**.` }],
      },
    ]);
  }, [setMessages]);

  const handleSelectDistrict = useCallback(async (dist: DistrictData) => {
    setConversationState((prev) => ({
      ...prev,
      step: 'show_stations',
      districtId: dist.id,
      districtName: dist.name,
    }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-dist-${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: dist.name }],
      },
    ]);

    // Fetch police stations
    try {
      const res = await fetch(`/api/locations?type=stations&districtId=${dist.id}`);
      const data = await res.json();
      const fetchedStations: PoliceStationData[] = data.items || [];
      setStations(fetchedStations);

      if (fetchedStations.length > 0) {
        const stationList = fetchedStations
          .map((s) => `🏛️ **${s.name}**${s.address ? `\n   📍 ${s.address}` : ''}${s.phone ? `\n   📞 ${s.phone}` : ''}`)
          .join('\n\n');

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-stations-${Date.now()}`,
            role: 'assistant',
            parts: [{ type: 'text', text: `He encontrado las siguientes comisarías cercanas en **${dist.name}**:\n\n${stationList}\n\n¿Necesitas algo más? Puedes llamar directamente, buscar en otra ubicación o hacer cualquier consulta.` }],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-no-stations-${Date.now()}`,
            role: 'assistant',
            parts: [{ 
              type: 'text', 
              text: `No he encontrado dependencias policiales físicas registradas en **${dist.name}** en nuestra base de datos.\n\nTe sugerimos recurrir a la comisaría de tu capital de provincia o comunicarte de inmediato con los números de ayuda y emergencia del Estado:\n\n📞 **Línea 100** (Orientación y ayuda gratuita las 24 horas)\n📞 **Central 105** (Emergencias de la Policía Nacional)` 
            }],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: 'Ocurrió un error al buscar comisarías. Por favor, intenta nuevamente o llama al **105** para emergencias.' }],
        },
      ]);
    }

    setConversationState((prev) => ({
      ...prev,
      step: 'general_chat',
    }));
  }, [setMessages]);

  const handleQuickAction = useCallback((option: QuickOption) => {
    if (option.value === 'restart') {
      setShowWelcome(true);
      setMessages([]);
      setConversationState(INITIAL_STATE);
      setStations([]);
    } else if (option.value === 'call_100') {
      window.open('tel:100', '_self');
    } else if (option.value === 'call_105') {
      window.open('tel:105', '_self');
    } else if (option.value === 'new_search') {
      setConversationState((prev) => ({
        ...prev,
        step: 'select_department',
        departmentId: undefined,
        departmentName: undefined,
        provinceId: undefined,
        provinceName: undefined,
        districtId: undefined,
        districtName: undefined,
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-newsearch-${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: 'Busquemos en otra ubicación. **¿En qué departamento te encuentras?**' }],
        },
      ]);
    }
  }, [setMessages]);

  const onFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = input.trim();
    if (!messageContent) return;

    if (showWelcome) {
      setShowWelcome(false);
      setConversationState({ step: 'general_chat' });
    }

    sendMessage({ text: messageContent });
    setInput('');
  }, [input, showWelcome, sendMessage]);

  // Quick action options based on state
  const getQuickActions = (): QuickOption[] => {
    if (conversationState.step === 'show_stations' || conversationState.step === 'general_chat') {
      const actions: QuickOption[] = [];
      
      if (stations.length > 0) {
        actions.push(
          { id: 'call-100', label: 'Llamar Línea 100', icon: 'phone', value: 'call_100', variant: 'danger' },
          { id: 'call-105', label: 'Llamar 105 (PNP)', icon: 'phone', value: 'call_105', variant: 'danger' },
        );
      }
      
      actions.push(
        { id: 'new-search', label: 'Buscar otra ubicación', icon: 'location', value: 'new_search', variant: 'primary' },
        { id: 'restart', label: 'Volver al inicio', icon: 'undo', value: 'restart', variant: 'secondary' },
      );
      
      return actions;
    }
    return [];
  };

  const showLocationSelector = 
    conversationState.step === 'select_department' ||
    conversationState.step === 'select_province' ||
    conversationState.step === 'select_district';

  const locationStep = 
    conversationState.step === 'select_department' ? 'department' :
    conversationState.step === 'select_province' ? 'province' : 'district';

  return (
    <div className={styles.container}>
       {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerAvatar} style={{ overflow: 'hidden' }}>
            <img src="/logo.jpeg" alt="Logo Alerta Violeta" width="40" height="40" style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>ALERTA VIOLETA DEMO</h1>
            <div className={styles.headerStatus}>
              <span className={styles.statusDot} />
              En línea
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <a href="/admin" className={styles.adminButton} title="Panel de Administración" id="btn-header-admin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Panel</span>
          </a>
        </div>
      </header>

      {/* Messages Area */}
      <main className={styles.messagesArea}>
        {showWelcome && messages.length === 0 ? (
          <WelcomeScreen onSelectRole={handleSelectRole} onStartChat={handleStartChat} />
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map((msg, i) => (
              <div key={msg.id} className={styles.messageRow}>
                <ChatBubble
                  role={msg.role as 'user' | 'assistant'}
                  content={
                    msg.parts
                      ?.filter((p: any) => p.type === 'text')
                      .map((p: any) => p.text)
                      .join('\n') || ''
                  }
                  isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
                  index={i}
                />
              </div>
            ))}

            {/* Location Selector */}
            <AnimatePresence mode="wait">
              {showLocationSelector && (
                <div className={styles.messageRow}>
                  <LocationSelector
                    step={locationStep}
                    departmentId={conversationState.departmentId}
                    provinceId={conversationState.provinceId}
                    onSelectDepartment={handleSelectDepartment}
                    onSelectProvince={handleSelectProvince}
                    onSelectDistrict={handleSelectDistrict}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            {!showLocationSelector && getQuickActions().length > 0 && !isLoading && (
              <div className={styles.messageRow}>
                <QuickActions options={getQuickActions()} onSelect={handleQuickAction} />
              </div>
            )}

            {/* Typing Indicator */}
            <AnimatePresence>
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div key="typing-indicator" className={styles.messageRow}>
                  <TypingIndicator />
                </div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className={styles.inputArea}>
        <form onSubmit={onFormSubmit} className={styles.inputForm}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className={styles.inputField}
            disabled={isLoading}
            id="chat-input"
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isLoading || !input.trim()}
            id="chat-send-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
        <div className={styles.footerBottom}>
          <p className={styles.disclaimer}>
            Las respuestas se basan en la información proporcionada. En caso de emergencia, llama al <strong>105</strong>.
          </p>
          <button 
            onClick={handleQuickExit} 
            className={styles.exitButtonBottom}
            title="Salir rápidamente de la aplicación" 
            id="btn-quick-exit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            <span>Salida Rápida</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
