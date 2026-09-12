import type { ScreenContext } from './screenContext';
import { ResponseExport } from './ResponseExport';
import { screenshotUrl } from './screenshotAssets';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  getThemeColor,
  getThemeLightColor,
  getThemeBorderColor,
  getThemeHoverColor,
} from '../utils/themeColors';
import {
  generationError,
  processMessageLLM,
  getWelcomeMessage,
  getQuickActions,
  isGeminiAvailable,
  type ChatMessage,
  type ConversationState,
} from './responseEngine';
import { isGeminiAvailable as checkGeminiConfig } from './geminiService';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  MinusCircle,
} from 'lucide-react';
import { renderMarkdown } from './MarkdownRenderer';
import { ResponseFeedback } from './ResponseFeedback';
import { findFeedbackQuery } from './feedback';
import { IntentBadge } from './IntentBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const initialConversationState: ConversationState = {
  mode: 'normal',
  quizScore: { correct: 0, total: 0 },
  quizHistory: [],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-center gap-1 bg-white border border-[#eaecf0] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <span className="text-xs text-gray-400 mr-1">Coach is typing</span>
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'limited-release': 'bg-amber-100 text-amber-700 border-amber-200',
    'coming-soon': 'bg-blue-100 text-blue-700 border-blue-200',
    tbd: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const label: Record<string, string> = {
    live: 'Live',
    'limited-release': 'Limited',
    'coming-soon': 'Coming Soon',
    tbd: 'TBD',
  };
  const cls = styles[status] || styles.tbd;
  const text = label[status] || status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${cls}`}>
      {text}
    </span>
  );
}

function ModeIndicator({ mode }: { mode: ConversationState['mode'] }) {
  if (mode === 'normal') return null;

  const config: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    training: {
      label: 'Training',
      icon: <BookOpen size={10} />,
      color: 'bg-blue-100 text-blue-700',
    },
    quiz: {
      label: 'Quiz',
      icon: <Sparkles size={10} />,
      color: 'bg-purple-100 text-purple-700',
    },
    troubleshoot: {
      label: 'Troubleshoot',
      icon: <AlertTriangle size={10} />,
      color: 'bg-amber-100 text-amber-700',
    },
    'merchant-sim': {
      label: 'Simulation',
      icon: <User size={10} />,
      color: 'bg-emerald-100 text-emerald-700',
    },
  };

  const c = config[mode];
  if (!c) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble(props: { message: ChatMessage; themeColor: string; query?: string; key?: string }) {
  const { message, themeColor, query } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isKnowledge = message.type === 'knowledge';
  const isQuiz = message.type === 'quiz';
  const isTraining = message.type === 'training';

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-1.5">
        <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-[#eaecf0]">
          {message.content}
        </span>
      </div>
    );
  }

  // Knowledge card
  if (isKnowledge && message.metadata) {
    return (
      <div className="flex px-4 py-1.5 justify-start">
        <div className="max-w-[85%] bg-white border border-[#eaecf0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            {message.metadata.feature && (
              <span className="text-sm font-semibold text-gray-800">{message.metadata.feature}</span>
            )}
            {message.metadata.status && <StatusBadge status={message.metadata.status} />}
            <IntentBadge intent={message.metadata.intent} compact />
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">{renderMarkdown(message.content)}</div>
          {message.metadata.source && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
              <BookOpen size={10} />
              {message.metadata.source}
            </div>
          )}
          {message.metadata.confidence && (
            <div className="mt-1 text-[10px] text-gray-400">
              Confidence: {message.metadata.confidence}
            </div>
          )}
          {/* Screenshots */}
          {message.metadata.screenshots && message.metadata.screenshots.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.metadata.screenshots.map((screenshot, idx) => (
                <div key={idx} className="border border-[#eaecf0] rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2">
                    {screenshot.step && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {screenshot.step}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 font-medium">{screenshot.caption}</span>
                  </div>
                  <img
                    src={screenshotUrl(screenshot.src)}
                    alt={screenshot.caption}
                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(screenshotUrl(screenshot.src), '_blank')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling;
                      if (placeholder) placeholder.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden bg-gray-100 flex items-center justify-center py-6">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                      <span className="text-[10px]">Screenshot: {screenshot.src}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 border-t border-gray-100 pt-2">
            <ResponseExport message={message} /><ResponseFeedback message={message} query={query} compact />
          </div>
        </div>
      </div>
    );
  }

  // Quiz message
  if (isQuiz) {
    return (
      <div className="flex px-4 py-1.5 justify-start">
        <div className="max-w-[85%] bg-white border border-[#eaecf0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-purple-500" />
            <span className="text-xs font-semibold text-purple-600">Quiz</span>
            <IntentBadge intent={message.metadata?.intent} compact />
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">{renderMarkdown(message.content)}</div>
        </div>
      </div>
    );
  }

  // Training message
  if (isTraining) {
    return (
      <div className="flex px-4 py-1.5 justify-start">
        <div className="max-w-[85%] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-600">Training</span>
            <IntentBadge intent={message.metadata?.intent} compact />
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {renderMarkdown(message.content)}
          </div>
        </div>
      </div>
    );
  }

  // User or assistant text
  return (
    <div className={`flex px-4 py-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-2xl rounded-br-sm shadow-md'
            : 'bg-white border border-[#eaecf0] text-gray-700 rounded-2xl rounded-bl-sm shadow-sm'
        }`}
        style={isUser ? { backgroundColor: getThemeColor(themeColor) } : undefined}
      >
        {!isUser && message.metadata?.intent && (
          <div className="mb-1.5"><IntentBadge intent={message.metadata.intent} compact /></div>
        )}
        {renderMarkdown(message.content)}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {!isUser && (
          <div className="mt-1.5 border-t border-gray-100 pt-1.5">
            <ResponseExport message={message} /><ResponseFeedback message={message} query={query} compact />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PathaoCoachChatBot({ screenContext }: { screenContext?: ScreenContext } = {}) {
  const themeColor = 'purple';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(initialConversationState);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // ---- Scroll to bottom ----
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ---- Welcome message on mount ----
  useEffect(() => {
    const welcome = getWelcomeMessage();
    setMessages([welcome]);
  }, []);

  // ---- Focus input when opened ----
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ---- Escape key to close ----
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // ---- Send message ----
  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text || inputValue).trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);

      try {
        const { response, newState } = await processMessageLLM(trimmed, conversationState, [...messages, userMsg], 'openrouter', screenContext);
        setMessages((prev) => [...prev, response]);
        setConversationState(newState);
      } catch {
        // Keep failed generation visible instead of substituting a stored answer.
        const { response, newState } = generationError(conversationState);
        setMessages((prev) => [...prev, response]);
        setConversationState(newState);
      } finally {
        setIsTyping(false);
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    },
    [inputValue, conversationState, isTyping, isOpen, messages, screenContext],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ---- Toggle open / close ----
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) return false;
      setUnreadCount(0);
      return true;
    });
  }, []);

  // ---- Reset conversation ----
  const handleReset = useCallback(() => {
    const welcome = getWelcomeMessage();
    setMessages([welcome]);
    setConversationState(initialConversationState);
    setInputValue('');
    setIsTyping(false);
  }, []);

  // ---- Quick actions ----
  const quickActions = getQuickActions(conversationState);

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Chat Window                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={chatWindowRef}
        className={`fixed z-[9999] flex flex-col bg-gray-50 border border-[#eaecf0] rounded-2xl shadow-2xl transition-all duration-300 ease-out origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          max-sm:inset-0 max-sm:rounded-none max-sm:w-full max-sm:h-full
          sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px]
        `}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-t-2xl max-sm:rounded-none"
          style={{
            background: `linear-gradient(135deg, ${getThemeColor(themeColor)}, ${getThemeHoverColor(themeColor)})`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">Pathao Commerce Coach</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <ModeIndicator mode={conversationState.mode} />
                {conversationState.mode === 'normal' && (
                  <span className="text-[10px] text-white/70">
                    {checkGeminiConfig() ? 'Powered by Gemini AI' : 'Always here to help'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Minimize"
            >
              <MinusCircle size={16} />
            </button>
            <button
              onClick={toggleChat}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-2 scroll-smooth">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} query={findFeedbackQuery(messages, msg.id)} themeColor={themeColor} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {!isTyping && quickActions.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="flex items-center gap-1 border border-[#eaecf0] rounded-full px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors bg-white"
                style={{
                  ['--hover-bg' as string]: getThemeLightColor(themeColor),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getThemeLightColor(themeColor);
                  e.currentTarget.style.borderColor = getThemeBorderColor(themeColor);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <ChevronRight size={12} className="text-gray-400" />
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-white border border-[#eaecf0] rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-offset-1 transition-shadow"
            style={{ ['--tw-ring-color' as string]: getThemeColor(themeColor) }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? 'Coach is thinking...' : 'Ask about Commerce...'}
              disabled={isTyping}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: getThemeColor(themeColor) }}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            {checkGeminiConfig() ? 'Powered by Gemini AI + Knowledge Base' : 'Powered by Pathao Commerce Knowledge Base'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Floating Action Button                                             */}
      {/* ----------------------------------------------------------------- */}
      <button
        onClick={toggleChat}
        className={`fixed z-[9998] flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out
          ${isOpen ? 'scale-90' : 'scale-100 hover:scale-105'}
          max-sm:bottom-6 max-sm:right-4 max-sm:w-14 max-sm:h-14
          sm:bottom-6 sm:right-6 sm:w-14 sm:h-14
        `}
        style={{ backgroundColor: getThemeColor(themeColor) }}
        title={isOpen ? 'Close coach' : 'Open coach'}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: getThemeColor(themeColor), opacity: 0.3 }}
          />
        )}
        <span className="relative text-white transition-transform duration-200">
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </span>

        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
