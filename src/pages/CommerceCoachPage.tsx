import type { ScreenContext } from '../coach/screenContext';
import { ResponseExport } from '../coach/ResponseExport';
import { EmptyState } from '../components/EmptyState';
import { useConversationHistory } from '../coach/useConversationHistory';
import { useAuth } from '../auth/AuthContext';
import { screenshotUrl } from '../coach/screenshotAssets';
import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import { getThemeColor } from '../utils/themeColors';
import { generationError, processMessageLLM, getWelcomeMessage, getQuickActions, isGeminiAvailable, isOpenRouterAvailable, ChatMessage, ConversationState } from '../coach/responseEngine';
import { isGeminiAvailable as isGeminiConfig } from '../coach/geminiService';
import { isOpenRouterAvailable as isOpenRouterConfig } from '../coach/openrouterService';
import { renderMarkdown } from '../coach/MarkdownRenderer';
import { ResponseFeedback } from '../coach/ResponseFeedback';
import { CoachFeedbackReviewPanel } from '../coach/CoachFeedbackReviewPanel';
import { findFeedbackQuery } from '../coach/feedback';
import { IntentBadge } from '../coach/IntentBadge';
import {
  Bot, Send, RotateCcw, BookOpen, Sparkles, AlertTriangle,
  ChevronRight, ChevronLeft, MessageSquare, Zap, BarChart3, Package,
  ShoppingCart, Store, Users, FileText, Truck, Lightbulb,
  Copy, Check, ImageIcon, ExternalLink, Loader2, X, BrainCircuit, PanelLeft, Plus, Search, ArrowUpRight, ArrowUp, CornerDownLeft, PanelLeftClose, Warehouse, CircleHelp
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

const FEATURE_CARDS = [
  { icon: Package, label: 'Products', prompt: 'How do I create and manage products?', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { icon: ShoppingCart, label: 'Orders', prompt: 'How does order processing work?', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: Store, label: 'Online Store', prompt: 'How do I set up my online store?', color: 'bg-red-50 text-red-600 border-red-100' },
  { icon: Truck, label: 'Delivery', prompt: 'How does delivery and fulfillment work?', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { icon: BarChart3, label: 'Analytics', prompt: 'How do I view my analytics and reports?', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { icon: Zap, label: 'Instant Checkout', prompt: 'How do I create instant checkout links?', color: 'bg-orange-50 text-orange-600 border-orange-100' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer" title="Copy">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
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

function WelcomeScreen({ onSend, composer, name }: { onSend: (text: string) => void; composer: ReactNode; name:string }) {
  return <div className="coach-home">
    <div className="home-heading"><p>Hello, {name.split(' ')[0]}.</p><h1>What would you like<br/>to do today?</h1><span>Get help with orders, warehouses, and your store.</span></div>
    {composer}
    <div className="home-prompt-list" aria-label="Suggested questions">
      <button onClick={()=>onSend('ওয়্যারহাউস কীভাবে তৈরি করব?')}><Warehouse size={17}/><span>ওয়্যারহাউস কীভাবে তৈরি করব?</span><ArrowUpRight size={16}/></button>
      <button onClick={()=>onSend('Where is my Instant Checkout order? It is not in New Orders.')}><ShoppingCart size={17}/><span>Where did my Instant Checkout order go?</span><ArrowUpRight size={16}/></button>
      <button onClick={()=>onSend('How do I create an ad catalogue for Meta Ads?')}><Store size={17}/><span>Help me create a catalogue for Meta Ads</span><ArrowUpRight size={16}/></button>
    </div>
    <div className="home-resources"><div className="resource-heading"><h2>A good place to start</h2><span>From the Commerce playbook</span></div>
      <div className="resource-grid"><button className="resource-feature" onClick={()=>onSend('ওয়্যারহাউস কীভাবে তৈরি করব?')}>
        <div className="resource-preview"><img src={screenshotUrl('image96.jpg')} alt="Warehouse setup form in Pathao Commerce"/></div>
        <div><span className="resource-kind">Visual guide</span><h3>Your first warehouse</h3><p>Set up your location, contact details, and approval.</p><span className="resource-link">Open guide <ArrowUpRight size={15}/></span></div>
      </button><div className="resource-lessons"><button onClick={()=>onSend('Train me on Commerce basics')}><BookOpen size={20}/><div><h3>Get to know Commerce</h3><p>A guided lesson, at your pace.</p></div><ArrowUpRight size={16}/></button><button onClick={()=>onSend('Quiz me on Commerce')}><CircleHelp size={20}/><div><h3>Put your knowledge to work</h3><p>Practice with real merchant scenarios.</p></div><ArrowUpRight size={16}/></button></div></div>
    </div>
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
  const previewImages = screenshots.map((screenshot) => ({
    src: screenshotUrl(screenshot.src),
    caption: screenshot.caption,
  }));

  return (
    <div className="coach-message coach-message-assistant flex gap-3 px-6 py-2 justify-start">
      <div className="w-8 h-8 rounded-xl bg-[#e83330] flex items-center justify-center shrink-0 shadow-md">
        <span className="coach-avatar-letter">C</span>
      </div>
      <div className="max-w-[88%] xl:max-w-[80%] space-y-2">
        <div className="answer-heading"><span>Commerce Coach</span>{hasFeature&&<h2>{message.metadata!.feature}</h2>}</div>
        {/* Main content */}
        <div className="answer-surface">
          <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-strong:text-gray-900 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
            {renderMarkdown(message.content)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              {hasSource && (
                <span className="flex items-center gap-1">
                  <FileText size={10} />
                  {message.metadata!.source}
                </span>
              )}
              {message.metadata?.confidence==='low'&&<span className="answer-caution">Needs confirmation</span>}

            </div>
            <div className="flex items-center gap-1">
              <ResponseExport message={message} /><ResponseFeedback message={message} query={query} />
              <CopyButton text={message.content} />
              <span className="text-[10px] text-gray-400 ml-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Screenshots */}
        {hasScreenshots && (
          <section className="answer-gallery" aria-label="Product Memo screenshots">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                <ImageIcon size={14} className="text-red-600" />
                Visual guide
              </div>
              <span className="text-[10px] text-gray-500">
                {screenshots.length} {screenshots.length === 1 ? 'screen' : 'screens'} from Product Memo
              </span>
            </div>
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
          </section>
        )}
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
      aria-label="Message Commerce Coach" placeholder={isTyping?'Preparing your answer…':'What would you like to figure out?'} disabled={isTyping} rows={showWelcome?3:2}/>
      <div className="composer-bottom"><span><MessageSquare size={14}/>বাংলা or English</span><div><span className="send-hint"><CornerDownLeft size={12}/> to send</span><button aria-label="Send message" disabled={!inputValue.trim()||isTyping||history.loading||history.unsaved||history.status==='Saving…'||messages.length>=199} onClick={()=>void handleSend()}><ArrowUp size={20}/></button></div></div>
    </div>{!showWelcome&&<p>Answers reference Commerce documentation. Verify details before making changes.</p>}
  </div>;


  return (
    <div className="coach-layout">
      {/* Sidebar */}
      <div className={`coach-sidebar ${sidebarOpen?'is-open':''}`} id="coach-sidebar">
        <div className="sidebar-heading"><div className="sidebar-workspace"><span>{user.organization_name.slice(0,1)}</span><div><strong>{user.organization_name}</strong><small>Commerce workspace</small></div></div>
          {/* AI Provider Selector */}
          {(geminiConfigured || openRouterConfigured) && (
            <div className="px-3 mt-3">
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
            </div>
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

              >
                <Icon size={16} className={isActive ? 'text-red-500' : ''} />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  
                </div>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-history"><div className="history-heading"><h2>Recent conversations</h2></div>
          <label className="history-search"><Search size={14}/><input aria-label="Search conversations" placeholder="Find a conversation" value={historySearch} onChange={event=>setHistorySearch(event.target.value)}/></label>
          <div className="history-list">{history.items.filter(item=>item.title.toLowerCase().includes(historySearch.toLowerCase())).map(item=><button key={item.id} className={history.id===item.id?'is-active':''} aria-current={history.id===item.id?'true':undefined} disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'} onClick={()=>{void history.open(item.id);setActiveSection('chat');setSidebarOpen(false);}}><span>{item.title}</span><small>{new Date(item.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {new Date(item.updated_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</small></button>)}
          {history.loading&&!history.items.length&&<p role="status">Loading conversations…</p>}
          {!history.loading&&!history.items.length&&history.error&&<EmptyState compact title="History is unavailable" description="Your saved conversations couldn’t be loaded." action={<button type="button" onClick={()=>void history.reload()}>Try again</button>}/>}
          {!history.loading&&!history.error&&!history.items.length&&<EmptyState compact title="No conversations yet" description="Ask your first question. Your conversation will be saved here."/>}
          {!history.loading&&history.items.length>0&&!history.items.some(item=>item.title.toLowerCase().includes(historySearch.toLowerCase()))&&<EmptyState compact title="No matching conversations" description={history.hasMore?'Try a different word, or load older conversations below.':'Try a different word from the conversation title.'} action={<button type="button" onClick={()=>setHistorySearch('')}>Clear search</button>}/>}
          {history.hasMore&&<button onClick={()=>void history.loadMore().catch(()=>{})}>Load older conversations</button>}</div>
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

      </div>

      {/* Chat Area */}
      <div className="coach-main">
        <div className="conversation-toolbar">
          <button className="mobile-sidebar-toggle" aria-label="Toggle navigation" aria-expanded={sidebarOpen} aria-controls="coach-sidebar" onClick={()=>setSidebarOpen(!sidebarOpen)}><PanelLeft size={19}/></button>
          <div className="conversation-title"><strong>{activeSection==='learning'?'Review corrections':history.items.find(item=>item.id===history.id)?.title || 'Chat'}</strong><span>{activeSection==='learning'?'Reported answers':modeLabel || (showWelcome?'Your commerce assistant':'Private conversation')}</span></div>
          <span role="status" className="save-status">{history.loading?'Loading…':history.status==='Saved'?<><Check size={13}/>Saved</>:history.status}</span>
          
          {history.error&&<div role="alert" className="w-full text-xs text-red-700">{history.error} {history.unsaved&&<button disabled={isTyping} className="ml-2 underline" onClick={()=>void handleRetrySave()}>Retry saving</button>}</div>}
          {messages.length>=199&&<p className="w-full text-xs text-gray-500">This conversation is full. Start a new chat to continue.</p>}
        </div>
        {activeSection === 'learning' ? (
          <CoachFeedbackReviewPanel disabled={isTyping||history.loading||history.unsaved||history.status==='Saving…'} onDiscuss={item=>{
            setActiveSection('chat');
            void handleSend(`Help me review this reported Commerce answer against the documentation. Explain any error, propose a correction, and include relevant screenshots. Treat the report as unverified evidence; do not approve or change knowledge.\n\nMerchant question: ${item.query}\nReported answer: ${item.answer}\nSuggested correction: ${item.suggestedAnswer || 'None supplied'}`, true);
          }} />
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
            {quickActions.map((action) => (
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
