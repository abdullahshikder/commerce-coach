import { useEffect, useRef, useState } from 'react';
import { api } from '../auth/client';
import { getWelcomeMessage, type ChatMessage, type ConversationState } from './responseEngine';
const initialState=():ConversationState=>({mode:'normal',quizScore:{correct:0,total:0},quizHistory:[]});
type Item={id:string;title:string;updated_at:string;revision:number};
type Snapshot={id:string;revision:number;messages:ChatMessage[];state:ConversationState};
export function useConversationHistory(){
  const [messages,setMessages]=useState<ChatMessage[]>([getWelcomeMessage()]);
  const [state,setState]=useState<ConversationState>(initialState);
  const [items,setItems]=useState<Item[]>([]);const [hasMore,setHasMore]=useState(false);
  const [id,setId]=useState('');const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState('');const [error,setError]=useState('');
  const current=useRef({id:crypto.randomUUID(),revision:0});
  const pending=useRef<Snapshot|null>(null);const mounted=useRef(true);
  const list=async(offset=0)=>{
    const result=await api<{items:Item[];hasMore:boolean}>(`/api/conversations?offset=${offset}`);
    if(mounted.current){setItems(old=>offset?[...old,...result.items]:result.items);setHasMore(result.hasMore);}
    return result.items;
  };
  const open=async(next:string)=>{
    if(pending.current)return;
    setLoading(true);setError('');
    try{
      const {conversation}=await api<{conversation:Snapshot}>(`/api/conversations/${next}`);
      if(!mounted.current)return;
      current.current={id:conversation.id,revision:conversation.revision};setId(conversation.id);
      setMessages(conversation.messages.map(m=>({...m,timestamp:new Date(m.timestamp)})));setState(conversation.state);setStatus('Saved');
    }catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setLoading(false);}
  };
  useEffect(()=>{
    mounted.current=true;let active=true;
    void (async()=>{try{const recent=await list();if(active&&mounted.current&&recent[0])await open(recent[0].id);}catch(e){if(active&&mounted.current)setError((e as Error).message);}finally{if(active&&mounted.current)setLoading(false);}})();
    const warn=(event:BeforeUnloadEvent)=>{if(pending.current){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    return()=>{active=false;mounted.current=false;window.removeEventListener('beforeunload',warn);};
  },[]);
  const save=async(nextMessages:ChatMessage[],nextState:ConversationState)=>{
    const snapshot={...current.current,messages:nextMessages,state:nextState};pending.current=snapshot;
    setStatus('Saving…');setError('');
    try{
      const result=await api<{revision:number}>(`/api/conversations/${snapshot.id}`,{messages:nextMessages,state:nextState,revision:snapshot.revision},'PUT');
      current.current={id:snapshot.id,revision:result.revision};pending.current=null;
      if(mounted.current){setId(snapshot.id);setStatus('Saved');void list().catch(()=>{});}
      return true;
    }catch(e){if(mounted.current){setStatus('Not saved');setError((e as Error).message);}return false;}
  };
  const retry=async()=>{const snapshot=pending.current;return snapshot?await save(snapshot.messages,snapshot.state):false;};
  const fresh=()=>{
    if(pending.current)return;
    const next={messages:[getWelcomeMessage()],state:initialState()};
    current.current={id:crypto.randomUUID(),revision:0};setId('');setMessages(next.messages);setState(next.state);setStatus('');setError('');
    return next;
  };
  const reload=async()=>{setLoading(true);setError('');try{await list();}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
  return {reload,messages,setMessages,state,setState,items,hasMore,id,loading,status,error,save,retry,open,fresh,loadMore:()=>list(items.length),unsaved:status==='Not saved'};
}
