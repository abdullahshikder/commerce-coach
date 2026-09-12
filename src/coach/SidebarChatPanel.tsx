import type { ScreenContext } from './screenContext';
import { ResponseExport } from './ResponseExport';
import { screenshotUrl } from './screenshotAssets';
import { useState, useRef, useEffect } from 'react';
import { X, Bot, Send, BookOpen, Sparkles, AlertTriangle, HelpCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { getThemeColor, getThemeLightColor, getThemeBorderColor, getThemeHoverColor } from '../utils/themeColors';
import { generationError, processMessageLLM, getWelcomeMessage, getQuickActions, ChatMessage, ConversationState } from './responseEngine';
import { isGeminiAvailable as isGeminiConfig } from './geminiService';
import { renderMarkdown } from './MarkdownRenderer';
import { ResponseFeedback } from './ResponseFeedback';
import { findFeedbackQuery } from './feedback';
import { IntentBadge } from './IntentBadge';

interface Props {
  screenContext?: ScreenContext;
  isOpen: boolean;
  onClose: () => void;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: 'bg-green-100 text-green-700 border-green-200',
    'live-with-dependency': 'bg-blue-100 text-blue-700 border-blue-200',
    limited: 'bg-yellow-100 text-yellow-700 text-yellow-200',
    'coming-soon': 'bg-blue-100 text-blue-700 border-blue-200',
    tbd: 'bg-gray-100 text-gray-600 border-gray-200',
    'out-of-scope': 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${colors[status] || colors.tbd}`}>
      {status.replace(/-/g, ' ')}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex px-4 py-2 justify-start">
      <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl px-4 py-2.5">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function MessageBubble(props: { message: ChatMessage; themeColor: string; query?: string; key?: string }) {
  const { message, themeColor, query } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isKnowledge = message.type === 'knowledge';
  const isQuiz = message.type === 'quiz';
  const isTraining = message.type === 'training';

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-1">
        <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-[#eaecf0]">
          {message.content}
        </span>
      </div>
    );
  }

  if (isKnowledge && message.metadata) {
    return (
      <div className="flex px-3 py-1.5 justify-start">
        <div className="max-w-[90%] bg-white border border-[#eaecf0] rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            {message.metadata.feature && (
              <span className="text-xs font-semibold text-gray-800">{message.metadata.feature}</span>
            )}
            {message.metadata.status && <StatusBadge status={message.metadata.status} />}
            <IntentBadge intent={message.metadata.intent} compact />
          </div>
          <div className="text-[11px] text-gray-600 leading-relaxed">{renderMarkdown(message.content)}</div>
          {message.metadata.screenshots && message.metadata.screenshots.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {message.metadata.screenshots.slice(0, 4).map((screenshot, idx) => (
                <div key={idx} className="border border-[#eaecf0] rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-2 py-1 flex items-center gap-1.5">
                    {screenshot.step && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                        {screenshot.step}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-500 font-medium">{screenshot.caption}</span>
                  </div>
                  <img
                    src={screenshotUrl(screenshot.src)}
                    alt={screenshot.caption}
                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(screenshotUrl(screenshot.src), '_blank')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {message.metadata.source && (
            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-gray-400">
              <BookOpen size={9} />
              {message.metadata.source}
            </div>
          )}
          <div className="mt-2 border-t border-gray-100 pt-2">
            <ResponseExport message={message} /><ResponseFeedback message={message} query={query} compact />
          </div>
        </div>
      </div>
    );
  }

  if (isQuiz) {
    return (
      <div className="flex px-3 py-1.5 justify-start">
        <div className="max-w-[90%] bg-white border border-[#eaecf0] rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1 mb-1.5">
            <Sparkles size={12} className="text-purple-500" />
            <span className="text-[10px] font-semibold text-purple-600">Quiz</span>
            <IntentBadge intent={message.metadata?.intent} compact />
          </div>
          <div className="text-[11px] text-gray-700 leading-relaxed">{renderMarkdown(message.content)}</div>
        </div>
      </div>
    );
  }

  if (isTraining) {
    return (
      <div className="flex px-3 py-1.5 justify-start">
        <div className="max-w-[90%] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1 mb-1.5">
            <BookOpen size={12} className="text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-600">Training</span>
            <IntentBadge intent={message.metadata?.intent} compact />
          </div>
          <div className="text-[11px] text-gray-700 leading-relaxed">{renderMarkdown(message.content)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex px-3 py-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-white border border-[#eaecf0] rounded-bl-sm shadow-sm text-gray-700'
        }`}
        style={isUser ? { backgroundColor: themeColor } : undefined}
      >
        {!isUser && message.metadata?.intent && (
          <div className="mb-1.5"><IntentBadge intent={message.metadata.intent} compact /></div>
        )}
        {renderMarkdown(message.content)}
        {!isUser && (
          <div className="mt-1.5 border-t border-gray-100 pt-1.5">
            <ResponseExport message={message} /><ResponseFeedback message={message} query={query} compact />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SidebarChatPanel({ isOpen, onClose, screenContext }: Props) {
  const themeColor = 'purple';
  const tc = getThemeColor(themeColor);
  const tl = getThemeLightColor(themeColor);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    mode: 'normal',
    quizScore: { correct: 0, total: 0 },
    quizHistory: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = getWelcomeMessage();
      setMessages([welcome]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const quickActions = getQuickActions(conversationState);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const { response, newState } = await processMessageLLM(userMsg.content, conversationState, [...messages, userMsg], 'openrouter', screenContext);
      setMessages((prev) => [...prev, response]);
      setConversationState(newState);
    } catch {
      const { response, newState } = generationError(conversationState);
      setMessages((prev) => [...prev, response]);
      setConversationState(newState);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setInputValue('');
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: action,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const { response, newState } = await processMessageLLM(action, conversationState, [...messages, userMsg], 'openrouter', screenContext);
      setMessages((prev) => [...prev, response]);
      setConversationState(newState);
    } catch {
      const { response, newState } = generationError(conversationState);
      setMessages((prev) => [...prev, response]);
      setConversationState(newState);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([getWelcomeMessage()]);
    setConversationState({
      mode: 'normal',
      quizScore: { correct: 0, total: 0 },
      quizHistory: [],
    });

  };

  const modeLabel = conversationState.mode === 'training' ? 'Training' :
    conversationState.mode === 'quiz' ? 'Quiz' :
    conversationState.mode === 'troubleshoot' ? 'Troubleshoot' : 'Normal';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-[100vw] bg-white border-l border-[#eaecf0] shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#eaecf0] flex items-center gap-3 shrink-0" style={{ background: `linear-gradient(135deg, ${tc}, ${tc}dd)` }}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">Commerce Coach</div>
            <div className="text-[10px] text-white/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {isGeminiConfig ? 'Gemini AI + ' : ''}{modeLabel} mode
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Reset chat"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-2 scroll-smooth">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} query={findFeedbackQuery(messages, msg.id)} themeColor={tc} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {!isTyping && quickActions.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="px-2.5 py-1 text-[10px] font-semibold border border-[#eaecf0] rounded-full text-[#5b667a] hover:bg-gray-50 hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1"
              >
                {action}
                <ChevronRight size={10} />
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-1 border-t border-[#eaecf0] shrink-0">
          <div className="flex items-center gap-2 bg-[#f8fafc] rounded-full border border-[#eaecf0] px-3 py-1.5 focus-within:border-gray-300 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about Pathao Commerce..."
              className="flex-1 bg-transparent text-[11px] text-[#111827] placeholder:text-gray-400 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: inputValue.trim() ? tc : '#e5e7eb' }}
            >
              <Send size={12} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
