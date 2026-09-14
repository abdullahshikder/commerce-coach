import type { ScreenContext } from '../coach/screenContext';
import { ResponseExport } from '../coach/ResponseExport';
import { EmptyState } from '../components/EmptyState';
import { useConversationHistory } from '../coach/useConversationHistory';
import { useAuth } from '../auth/AuthContext';
import { screenshotUrl } from '../coach/screenshotAssets';
import { getScreenshotTutorials } from '../coach/screenshots/manifest';
import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import { getThemeColor } from '../utils/themeColors';
import { generationError, processMessageLLM, getWelcomeMessage, getQuickActions, ChatMessage, ConversationState } from '../coach/responseEngine';
import { isGeminiAvailable as isGeminiConfig } from '../coach/geminiService';
import { isOpenRouterAvailable as isOpenRouterConfig } from '../coach/openrouterService';
import { renderMarkdown } from '../coach/MarkdownRenderer';
import { ResponseFeedback } from '../coach/ResponseFeedback';
import { CoachFeedbackReviewPanel } from '../coach/CoachFeedbackReviewPanel';
import { findFeedbackQuery } from '../coach/feedback';
import {
  BookOpen, Sparkles, AlertTriangle, ChevronRight, ChevronLeft,
  MessageSquare, ShoppingCart, Store, Copy, Check, ImageIcon,
  Loader2, X, BrainCircuit, PanelLeft, Plus, Search, ArrowUpRight,
  ArrowUp, PanelLeftClose, Warehouse, CircleHelp,
} from 'lucide-react';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const SIDEBAR_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, desc: 'Ask anything' },
  { id: 'training', label: 'Training', icon: BookOpen, desc: 'Learn step by step' },
  { id: 'quiz', label: 'Quiz', icon: Sparkles, desc: 'Test knowledge' },
  { id: 'troubleshoot', label: 'Issues', icon: AlertTriangle, desc: 'Fix problems' },
  { id: 'learning', label: 'Learning', icon: BrainCircuit, desc: 'Review corrections' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="answer-copy-button" title="Copy answer">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
      <span>{copied ? 'Copied' : 'Copy answer'}</span>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-6 py-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-[#e83330] flex items-center justify-center shrink-0 shadow-md">
        <span className="coach-avatar-letter">C</span>
      </div>
      <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <Loader2 size={14} className="text-gray-400 animate-spin" />
        <span className="text-xs text-gray-500 font-medium">Thinking...</span>
      </div>
    </div>
  );
}

type AnswerBlock = { type: 'prose' | 'steps' | 'bullets'; items: string[] };

function structureAnswer(content: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let current: AnswerBlock | null = null;
  const push = (type: AnswerBlock['type'], value: string) => {
    if (!current || current.type !== type) {
      current = { type, items: [] };
      blocks.push(current);
    }
    current.items.push(value);
  };

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line) { current = null; continue; }
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    const bullet = line.match(/^[•*-]\s+(.+)$/);
    if (numbered) push('steps', numbered[1]);
    else if (bullet) push('bullets', bullet[1]);
    else push('prose', line);
  }
  return blocks;
}

function StructuredAnswer({ content }: { content: string }) {
  const blocks = structureAnswer(content);
  let stepsSeen = false;
  return <div className="structured-answer">{blocks.map((block, blockIndex) => {
    if (block.type === 'steps') {
      stepsSeen = true;
      return <ol className="answer-steps" key={`steps-${blockIndex}`}>{block.items.map((item, index) => <li key={`${index}-${item}`}><span>{index + 1}</span><div>{renderMarkdown(item)}</div></li>)}</ol>;
    }
    if (block.type === 'bullets') {
      return <ul className="answer-bullets" key={`bullets-${blockIndex}`}>{block.items.map((item, index) => <li key={`${index}-${item}`}><span aria-hidden="true"/><div>{renderMarkdown(item)}</div></li>)}</ul>;
    }
    // How-to answers often close with the expected result or timing after the actionable steps.
    const isOutcome = stepsSeen && blockIndex === blocks.length - 1;
    return <div className={isOutcome ? 'answer-outcome' : 'answer-prose'} key={`prose-${blockIndex}`}>{renderMarkdown(block.items.join('\n'))}</div>;
  })}</div>;
}

function WelcomeScreen({ onSend, composer, name }: { onSend: (text: string) => void; composer: ReactNode; name:string }) {
  return <div className="coach-home">
    <div className="home-heading"><p>Hello, {name.split(' ')[0]}.</p><h1>How can I help?</h1><span>Ask one question about Pathao Commerce.</span></div>
    {composer}
    <div className="home-prompt-list" aria-label="Suggested questions">
      <button onClick={()=>onSend('ওয়্যারহাউস কীভাবে তৈরি করব?')}><Warehouse size={17}/><span>ওয়্যারহাউস কীভাবে তৈরি করব?</span><ArrowUpRight size={16}/></button>
      <button onClick={()=>onSend('Where is my Instant Checkout order? It is not in New Orders.')}><ShoppingCart size={17}/><span>Where did my Instant Checkout order go?</span><ArrowUpRight size={16}/></button>
      <button onClick={()=>onSend('How do I create an ad catalogue for Meta Ads?')}><Store size={17}/><span>Help me create a catalogue for Meta Ads</span><ArrowUpRight size={16}/></button>
    </div>
    <details className="home-learn-more"><summary><span>More ways to learn</span><ChevronRight size={15}/></summary><div>
      <button onClick={()=>onSend('Train me on Commerce basics')}><BookOpen size={18}/><span><strong>Guided lesson</strong><small>Learn Commerce step by step.</small></span></button>
      <button onClick={()=>onSend('Quiz me on Commerce')}><CircleHelp size={18}/><span><strong>Practice quiz</strong><small>Check what you know.</small></span></button>
    </div></details>
  </div>;
}

function MessageBubble(props: { message: ChatMessage; themeColor: string; query?: string; onImageClick?: (images: { src: string; caption: string }[], index: number) => void; key?: string }) {
  const { message, themeColor, query, onImageClick } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center px-6 py-2">
        <span className="text-[11px] text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 font-medium">{message.content}</span>
      </div>
    );
  }

  // User message
  if (isUser) {
    return (
      <div className="coach-message coach-message-user flex gap-3 px-6 py-2 justify-end">
        <div
          className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed text-white rounded-2xl rounded-br-md shadow-md"
          style={{ backgroundColor: getThemeColor(themeColor) }}
        >
          {renderMarkdown(message.content)}
        </div>
        <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
          U
        </div>
      </div>
    );
  }

  // Assistant message
  const hasScreenshots = message.metadata?.screenshots && message.metadata.screenshots.length > 0;
  const hasSource = message.metadata?.source;
  const hasFeature = message.metadata?.feature;
  const screenshots = message.metadata?.screenshots ?? [];
  const tutorialLinks = getScreenshotTutorials(screenshots);
  const previewImages = screenshots.map((screenshot) => ({
    src: screenshotUrl(screenshot.src),
    caption: screenshot.caption,
  }));

  return (
    <div className="coach-message coach-message-assistant flex gap-3 px-6 py-2 justify-start">
      <div className="w-8 h-8 rounded-xl bg-[#e83330] flex items-center justify-center shrink-0 shadow-md">
        <span className="coach-avatar-letter">C</span>
      </div>
      <div className="answer-card">
        <p className="answer-label">Answer</p>
        {hasFeature&&<div className="answer-heading"><h2>{message.metadata!.feature}</h2></div>}
        {/* Main content */}
        <div className="answer-surface">
          <StructuredAnswer content={message.content}/>
        </div>

        {/* Screenshots */}
        {hasScreenshots && (
          <section className="answer-gallery" aria-label="Visual guide">
            <div className="answer-gallery-heading">
              <span><ImageIcon size={15}/>Visual guide</span>
              <small>{screenshots.length} {screenshots.length === 1 ? 'step' : 'steps'}</small>
            </div>
            <div className="answer-gallery-content">
              <div className="flex snap-x snap-proximity gap-3 overflow-x-auto pb-2">
              {screenshots.map((screenshot, idx) => (
                <button
                  key={screenshot.src}
                  type="button"
                  onClick={() => onImageClick?.(previewImages, idx)}
                  className="guide-image-button"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-50">
                    <img
                      src={screenshotUrl(screenshot.src)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.015]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex min-h-14 items-start gap-2 border-t border-gray-100 px-3 py-2.5">
                    {screenshot.step && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-red-100 px-1 text-[10px] font-bold text-red-700">
                        {screenshot.step}
                      </span>
                    )}
                    <span className="text-[11px] font-medium leading-4 text-gray-700">{screenshot.caption}</span>
                  </div>
                </button>
              ))}
              </div>
              {tutorialLinks.length > 0 && <div className="answer-tutorials">{tutorialLinks.map((link) => <p key={link.url}><span>{link.title}</span><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}<ArrowUpRight size={12}/></a></p>)}</div>}
            </div>
          </section>
        )}
        <div className="answer-actions">
          <CopyButton text={message.content} />
          <div className="answer-export-controls"><ResponseExport message={message}/></div>
          <div className="answer-feedback-controls"><ResponseFeedback message={message} query={query}/></div>
          {(hasSource || message.metadata?.confidence==='low') && <div className="answer-provenance">
            {hasSource&&<span>{message.metadata!.source}</span>}
            {message.metadata?.confidence==='low'&&<span className="answer-caution">Needs confirmation</span>}
          </div>}
          <time>{message.timestamp.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time>
        </div>
      </div>
    </div>
  );
}

export default function CommerceCoachPage({ screenContext }: { screenContext?: ScreenContext } = {}) {
  const { user } = useAuth();
  const themeColor = 'red';
  const geminiConfigured = isGeminiConfig();
  const openRouterConfigured = isOpenRouterConfig();

  const history=useConversationHistory();
  const {messages,setMessages,state:conversationState,setState:setConversationState}=history;
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [historyExpanded,setHistoryExpanded]=useState(true);
  const [historyLimit,setHistoryLimit]=useState(8);
  const [historySearch,setHistorySearch]=useState('');
  useEffect(()=>{const close=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape')setSidebarOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const [activeSection, setActiveSection] = useState('chat');
  const [previewGallery, setPreviewGallery] = useState<{ images: { src: string; caption: string }[]; index: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini'>(openRouterConfigured ? 'openrouter' : 'gemini');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const sending = useRef(false);
  const handleSend = useCallback(
    async (text?: string, newConversation = false) => {
      const trimmed = (text || inputValue).trim();
      if (!trimmed || sending.current || isTyping || history.loading || history.unsaved || history.status==='Saving…') return;
      if(!newConversation && messages.length>=199){setInputValue(trimmed);return;}
      // Use the fresh snapshot immediately; React state still contains the old chat this turn.
      const base = newConversation ? history.fresh() : {messages, state:conversationState};
      if(!base)return;
      sending.current=true;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages([...base.messages, userMsg]);
      setInputValue('');
      setIsTyping(true);

      const nextMessages=[...base.messages,userMsg];
      try {
        // Persist the question before generation so an interrupted response never loses the user's turn.
        if(!await history.save(nextMessages,base.state))return;
        let result;
        try{result=await processMessageLLM(trimmed,base.state,nextMessages,aiProvider,screenContext);}
        catch{result=generationError(base.state);}
        const completed=[...nextMessages,result.response];
        setMessages(completed);setConversationState(result.newState);
        await history.save(completed,result.newState);
      } finally {sending.current=false;setIsTyping(false);}

    },
    [inputValue, conversationState, isTyping, messages, aiProvider, history, screenContext],
  );

  const handleRetrySave=async()=>{
    if(isTyping)return;
    setIsTyping(true);
    try{
      if(!await history.retry())return;
      const question=messages[messages.length-1];
      if(question?.role==='user'){
        let result;
        try{result=await processMessageLLM(question.content,conversationState,messages,aiProvider,screenContext);}
        catch{result=generationError(conversationState);}
        const completed=[...messages,result.response];setMessages(completed);setConversationState(result.newState);
        await history.save(completed,result.newState);
      }
    }finally{setIsTyping(false);}
  };

  const handleReset = () => {
    if(isTyping||history.loading||history.unsaved||history.status==='Saving…')return;
    history.fresh();setInputValue('');setActiveSection('chat');setSidebarOpen(false);
  };

  useEffect(()=>{const start=(event:globalThis.KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();handleReset();inputRef.current?.focus();}};window.addEventListener('keydown',start);return()=>window.removeEventListener('keydown',start);},[isTyping,history.loading,history.unsaved,history.status]);
  const quickActions = getQuickActions(conversationState);

  const modeLabel =
    conversationState.mode === 'training' ? 'Training' :
    conversationState.mode === 'quiz' ? 'Quiz' :
    conversationState.mode === 'troubleshoot' ? 'Troubleshoot' :
    conversationState.mode === 'merchant-sim' ? 'Simulation' : null;

  const sectionPrompts: Record<string, string> = {
    training: 'Train me on Commerce basics',
    quiz: 'Quiz me on Pathao Commerce',
    troubleshoot: 'I have an issue to troubleshoot',
  };

  const showWelcome = messages.length <= 1;
  const composer = <div className={`conversation-composer ${showWelcome?'home-composer':''}`}>
    <label className="sr-only" htmlFor="coach-message">Message Commerce Coach</label>
    <div className="composer-field"><textarea id="coach-message" ref={inputRef} value={inputValue} onChange={event=>setInputValue(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void handleSend();}}}
      aria-label="Message Commerce Coach" placeholder={isTyping?'Preparing your answer…':'What would you like to figure out?'} disabled={isTyping} rows={showWelcome?3:1}/>
      <div className="composer-bottom"><span><MessageSquare size={14}/>বাংলা or English</span><div><button aria-label="Send message" disabled={!inputValue.trim()||isTyping||history.loading||history.unsaved||history.status==='Saving…'||messages.length>=199} onClick={()=>void handleSend()}><ArrowUp size={20}/></button></div></div>
    </div>
  </div>;

  const filteredHistory=history.items.filter(item=>item.title.toLowerCase().includes(historySearch.toLowerCase()));
  const visibleHistory=filteredHistory.slice(0,historyLimit);


  return (
    <div className="coach-layout">
      {/* Sidebar */}
      <aside className={`coach-sidebar ${sidebarOpen?'is-open':''} ${sidebarCollapsed?'is-collapsed':''}`} id="coach-sidebar">
        <div className="sidebar-heading"><div className="sidebar-workspace"><span>{user.organization_name.slice(0,1)}</span><div><strong>{user.organization_name}</strong><small>Commerce workspace</small></div></div>
          {/* AI Provider Selector */}
          {(geminiConfigured || openRouterConfigured) && (
            <details className="provider-settings"><summary>{aiProvider === 'openrouter' ? 'OpenRouter' : 'Gemini'}<ChevronRight size={13}/></summary>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAiProvider('openrouter')}
                  disabled={!openRouterConfigured}
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all cursor-pointer ${
                    aiProvider === 'openrouter'
                      ? 'bg-white text-red-700 shadow-sm'
                      : openRouterConfigured
                        ? 'text-gray-500 hover:text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  OpenRouter
                </button>
                <button
                  onClick={() => setAiProvider('gemini')}
                  disabled={!geminiConfigured}
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all cursor-pointer ${
                    aiProvider === 'gemini'
                      ? 'bg-white text-red-700 shadow-sm'
                      : geminiConfigured
                        ? 'text-gray-500 hover:text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Gemini
                </button>
              </div>
            </details>
          )}
        </div>

        <button className="new-conversation-button" disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'} onClick={handleReset}><Plus size={17}/>New chat<span>⌘ K</span></button>
        <nav className="sidebar-modes" aria-label="Coach modes">
          {SIDEBAR_ITEMS.filter(item => item.id !== 'learning' || user.role !== 'member').map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);setSidebarOpen(false);
                  if (item.id !== 'chat' && sectionPrompts[item.id]) {
                    void handleSend(sectionPrompts[item.id], true);
                  }
                }}
                disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'}
                aria-current={isActive?'page':undefined}
                className={`mode-button ${isActive?'is-active':''}`}
                title={item.label}
              >
                <Icon size={16} className={isActive ? 'text-red-500' : ''} />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  
                </div>
              </button>
            );
          })}
        </nav>

        <div className={`sidebar-history ${historyExpanded?'is-expanded':''}`}><button className="history-heading" onClick={()=>setHistoryExpanded(value=>!value)} aria-expanded={historyExpanded}><h2>Recent chats</h2><ChevronRight size={14}/></button>
          {historyExpanded&&<label className="history-search"><Search size={14}/><input aria-label="Search conversations" placeholder="Find a conversation" value={historySearch} onChange={event=>setHistorySearch(event.target.value)}/></label>}
          {historyExpanded&&<div className="history-list">{visibleHistory.map(item=><button key={item.id} className={history.id===item.id?'is-active':''} aria-current={history.id===item.id?'true':undefined} disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'} onClick={()=>{void history.open(item.id);setActiveSection('chat');setSidebarOpen(false);}}><span>{item.title}</span><small>{new Date(item.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {new Date(item.updated_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</small></button>)}
          {history.loading&&!history.items.length&&<p role="status">Loading conversations…</p>}
          {!history.loading&&!history.items.length&&history.error&&<EmptyState compact title="History is unavailable" description="Your saved conversations couldn’t be loaded." action={<button type="button" onClick={()=>void history.reload()}>Try again</button>}/>}
          {!history.loading&&!history.error&&!history.items.length&&<EmptyState compact title="No conversations yet" description="Ask your first question. Your conversation will be saved here."/>}
          {!history.loading&&history.items.length>0&&!filteredHistory.length&&<EmptyState compact title="No matching conversations" description={history.hasMore?'Try a different word, or load older conversations below.':'Try a different word from the conversation title.'} action={<button type="button" onClick={()=>setHistorySearch('')}>Clear search</button>}/>}
          {visibleHistory.length<filteredHistory.length&&<button onClick={()=>setHistoryLimit(limit=>limit+8)}>Show more conversations</button>}
          {history.hasMore&&visibleHistory.length>=filteredHistory.length&&<button onClick={()=>void history.loadMore().catch(()=>{})}>Load older conversations</button>}</div>}
        </div>
        {/* Score badge */}
        {conversationState.quizScore.total > 0 && (
          <div className="mx-3 mb-2 p-3 bg-gradient-to-r from-red-50 to-red-50 rounded-xl border border-red-100">
            <div className="text-[10px] text-red-600 font-semibold uppercase tracking-wide mb-1">Quiz Score</div>
            <div className="text-lg font-bold text-red-700">
              {conversationState.quizScore.correct}/{conversationState.quizScore.total}
              <span className="text-xs font-normal text-red-500 ml-1">
                ({Math.round((conversationState.quizScore.correct / conversationState.quizScore.total) * 100)}%)
              </span>
            </div>
          </div>
        )}

        <div className="sidebar-footer"><BookOpen size={15}/><span>{openRouterConfigured||geminiConfigured?'AI + Commerce documentation':'AI connection required'}</span></div>

      </aside>

      {/* Chat Area */}
      <div className="coach-main">
        <div className="conversation-toolbar">
          <button className="mobile-sidebar-toggle" aria-label={sidebarCollapsed?'Show navigation':'Hide navigation'} aria-expanded={sidebarOpen||!sidebarCollapsed} aria-controls="coach-sidebar" onClick={()=>{if(window.matchMedia('(max-width: 767px)').matches)setSidebarOpen(!sidebarOpen);else setSidebarCollapsed(value=>!value);}}>{sidebarCollapsed?<PanelLeft size={19}/>:<PanelLeftClose size={19}/>}</button>
          <div className="conversation-title"><span className="conversation-label">{activeSection==='learning'?'Review corrections':'Merchant question'}</span><strong>{activeSection==='learning'?'Review corrections':history.items.find(item=>item.id===history.id)?.title || 'Chat'}</strong><span className="conversation-context">{activeSection==='learning'?'Reported answers':modeLabel || (showWelcome?'Your commerce assistant':'Private conversation')}</span></div>
          <span role="status" className="save-status">{history.loading?'Loading…':history.status==='Saved'?<><Check size={13}/>Saved</>:history.status}</span>
          
          {history.error&&<div role="alert" className="w-full text-xs text-red-700">{history.error} {history.unsaved&&<button disabled={isTyping} className="ml-2 underline" onClick={()=>void handleRetrySave()}>Retry saving</button>}</div>}
          {messages.length>=199&&<p className="w-full text-xs text-gray-500">This conversation is full. Start a new chat to continue.</p>}
        </div>
        {activeSection === 'learning' ? (
          <CoachFeedbackReviewPanel disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'} />
        ) : (
          <>
        {/* Messages or Welcome */}
        {showWelcome ? (
          <WelcomeScreen onSend={handleSend} composer={composer} name={user.name} />
        ) : (
          <div className="conversation-messages">
            {messages.slice(1).map((msg) => (
              <MessageBubble key={msg.id} message={msg} query={findFeedbackQuery(messages, msg.id)} themeColor={themeColor} onImageClick={(images, index) => { setPreviewGallery({ images, index }); setZoom(1); }} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Actions */}
        {!isTyping && !showWelcome && quickActions.length > 0 && (
          <div className="conversation-actions">
            {quickActions.slice(0,3).map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all bg-white/80 cursor-pointer font-medium"
              >
                <ChevronRight size={12} className="text-gray-400" />
                {action}
              </button>
            ))}
          </div>
        )}

        {!showWelcome&&composer}

          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewGallery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          onClick={() => { setPreviewGallery(null); setZoom(1); }}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => { setPreviewGallery(null); setZoom(1); }}
              className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 z-20 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Counter */}
            <span className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2.5 py-1 rounded-full z-20">
              {previewGallery.index + 1} / {previewGallery.images.length}
            </span>

            {/* Prev */}
            {previewGallery.images.length > 1 && (
              <button
                onClick={() => { setZoom(1); setPreviewGallery((g) => g ? { ...g, index: (g.index - 1 + g.images.length) % g.images.length } : g); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 z-20 cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Next */}
            {previewGallery.images.length > 1 && (
              <button
                onClick={() => { setZoom(1); setPreviewGallery((g) => g ? { ...g, index: (g.index + 1) % g.images.length } : g); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 z-20 cursor-pointer"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5 z-20">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="w-7 h-7 flex items-center justify-center text-white hover:text-gray-200 cursor-pointer text-lg font-bold"
              >
                −
              </button>
              <span className="text-white text-xs min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="w-7 h-7 flex items-center justify-center text-white hover:text-gray-200 cursor-pointer text-lg font-bold"
              >
                +
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-white text-[10px] hover:text-gray-200 cursor-pointer ml-1 underline"
              >
                Reset
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-auto w-full">
              <img
                src={previewGallery.images[previewGallery.index].src}
                alt={previewGallery.images[previewGallery.index].caption}
                className="max-w-full max-h-[78vh] rounded-xl shadow-2xl object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Caption */}
            <p className="text-center text-white text-sm mt-2 bg-black/40 rounded-lg px-4 py-2 w-full max-w-2xl">
              {previewGallery.images[previewGallery.index].caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
