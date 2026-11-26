import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Wrench,
  X,
} from 'lucide-react';
import { getPreferredScrollBehavior, useModalAccessibility } from '../hooks/useModalAccessibility';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestLeadForm?: boolean;
  suggestedServiceId?: string;
  suggestedPrefillSummary?: string;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onNavigateToLeadForm: (serviceId?: string, prefillSummary?: string) => void;
  hidden?: boolean;
}

const createMessageId = (prefix: 'user' | 'model'): string =>
  `${prefix}-${crypto.randomUUID()}`;

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Dobrý den! Jsem kontextový asistent stavební party STAVPARTA (centrála Zábřeh na Moravě). Rád zodpovím dotazy k našim službám, orientačním cenám, termínům nebo průběhu rekonstrukce. Na co se chcete zeptat?',
};

const QUICK_PROMPTS = [
  'Co zahrnuje renovace bytového jádra?',
  'Pokládáte i vinylové podlahy s nivelací?',
  'Jaké jsou platební podmínky?',
  'Chci nezávaznou poptávku na zaměření',
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onToggle,
  onNavigateToLeadForm,
  hidden = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  useModalAccessibility({
    isOpen: isOpen && !hidden,
    onClose: () => onToggle(false),
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    returnFocusRef: launcherRef,
    lockBodyScroll: false,
  });

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: getPreferredScrollBehavior() });
    }
  }, [isOpen, messages.length, isLoading]);

  if (hidden) return null;

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const apiMessages = nextHistory
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 600) }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        suggestLeadForm?: boolean;
        suggestedServiceId?: string;
        suggestedPrefillSummary?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrorMsg(
          data.error || 'Nepodařilo se spojit s asistentem. Zkuste to prosím znovu.'
        );
        return;
      }

      const modelMessage: ChatMessage = {
        id: createMessageId('model'),
        role: 'model',
        text: data.reply || 'Děkuji za dotaz.',
        suggestLeadForm: Boolean(data.suggestLeadForm),
        suggestedServiceId: data.suggestedServiceId || undefined,
        suggestedPrefillSummary: data.suggestedPrefillSummary || undefined,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch {
      setErrorMsg(
        'Došlo k chybě sítě při komunikaci s asistentem. Můžete využít poptávkový formulář.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleReset = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setErrorMsg(null);
    setInput('');
  };

  const handleGoToForm = (serviceId?: string, summary?: string) => {
    onToggle(false);
    onNavigateToLeadForm(serviceId, summary);
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-widget-title"
          className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-24 z-50 sm:w-[390px] h-[500px] max-h-[72vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#17232D] text-white px-4 py-3.5 flex items-center justify-between gap-3 border-b border-[#263746] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#C2560A] flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div id="chat-widget-title" className="text-sm font-extrabold leading-tight truncate">
                  STAVPARTA Asistent
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  Dotazy ke službám a rekonstrukcím
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                title="Nová konverzace"
                aria-label="Vymazat konverzaci"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-[#263746] rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggle(false)}
                title="Zavřít chat"
                aria-label="Zavřít chat"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-[#263746] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#17232D] text-white rounded-br-sm'
                      : 'bg-white text-[#17232D] border border-slate-200 rounded-bl-sm shadow-2xs'
                  }`}
                >
                  {msg.text}

                  {msg.role === 'model' && msg.suggestLeadForm && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          handleGoToForm(
                            msg.suggestedServiceId,
                            msg.suggestedPrefillSummary
                          )
                        }
                        className="w-full py-2 px-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Přejít do poptávkového formuláře</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Quick starter suggestions before first user message */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-1 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600">
                  Časté dotazy k vyzkoušení:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="text-left px-2.5 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-[#C2560A]/60 rounded-lg text-[11px] font-semibold text-[#17232D] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-start">
                <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl rounded-bl-sm text-xs text-slate-600 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B84F00]" />
                  <span>Připravuji odpověď...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                id="chat-widget-error"
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoToForm()}
                  className="w-full py-2 px-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Otevřít poptávkový formulář</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Input & Quick Lead Bar */}
          <div className="bg-white border-t border-slate-200 p-3 space-y-2 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor="chat-widget-input" className="sr-only">
                Dotaz pro asistenta STAVPARTA
              </label>
              <input
                id="chat-widget-input"
                ref={inputRef}
                type="text"
                maxLength={600}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-invalid={Boolean(errorMsg)}
                aria-describedby={errorMsg ? 'chat-widget-error' : undefined}
                placeholder="Zeptejte se na služby nebo cenu..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-[#17232D] focus:outline-none focus:border-[#C2560A] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Odeslat zprávu"
                className="p-2.5 bg-[#C2560A] hover:bg-[#9E4306] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5">
              <span>Chcete rovnou nezávaznou kalkulaci?</span>
              <button
                type="button"
                onClick={() => handleGoToForm()}
                className="font-bold text-[#B84F00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Do poptávky</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corner Launcher Button */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => onToggle(!isOpen)}
        aria-label={isOpen ? 'Zavřít asistenta' : 'Otevřít chatovacího asistenta'}
        aria-expanded={isOpen}
        className="fixed bottom-4 left-4 md:left-auto md:bottom-6 md:right-6 z-40 min-h-[48px] px-4 py-3 bg-[#17232D] hover:bg-[#263746] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl border border-[#263746] flex items-center gap-2 cursor-pointer transition-all"
      >
        <span className="w-6 h-6 rounded-lg bg-[#C2560A] flex items-center justify-center shrink-0">
          {isOpen ? (
            <X className="w-3.5 h-3.5 text-white" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          )}
        </span>
        <span>{isOpen ? 'Zavřít chat' : 'Dotaz ke službám'}</span>
      </button>
    </>
  );
};
