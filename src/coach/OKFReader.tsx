import {useEffect,useRef,useState} from 'react';
import {api} from '../auth/client';
import {EmptyState} from '../components/EmptyState';
import {OKFArticle,safeWebLink} from './OKFArticle';
type Item={id:string;title:string;type:string;category:string;bundle:string;path:string};
type Article=Item&{publication?:string;images?:{path:string;url:string}[];body:string;metadata:Record<string,any>;origin:string;trust:string;current:boolean;links:{href:string;id?:string;title?:string}[]};
const labels:Record<string,string>={faqs:'Merchant FAQs',tutorials:'Tutorial videos',knowledge:'Product knowledge',workflows:'Workflows',training:'Training',quizzes:'Quizzes','order-sources':'Order routing','visual-guides':'Visual guides',workspace:'Workspace bundles'};
export function OKFReader(){
 const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[items,setItems]=useState<Item[]>([]),[categories,setCategories]=useState<string[]>([]);
 const [selected,setSelected]=useState(''),[article,setArticle]=useState<Article|null>(null),[loading,setLoading]=useState(true),[reading,setReading]=useState(false);
 const [error,setError]=useState(''),[articleError,setArticleError]=useState(''),[retry,setRetry]=useState(0),[total,setTotal]=useState(0),[mobileArticle,setMobileArticle]=useState(false);
 const scroll=useRef<HTMLElement>(null);const [back,setBack]=useState<string[]>([]);
 useEffect(()=>{let active=true;setLoading(true);setError('');const timer=setTimeout(()=>{void api(`/api/library?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`).then(data=>{if(!active)return;setItems(data.items);setCategories(data.categories);setTotal(data.total);setSelected(current=>current||data.items[0]?.id||'');}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});},180);return()=>{active=false;clearTimeout(timer);};},[query,category,retry]);
 useEffect(()=>{if(!selected)return;let active=true;setReading(true);setArticleError('');setArticle(null);void api<Article>(`/api/library/document?id=${encodeURIComponent(selected)}`).then(data=>{if(active){setArticle(data);scroll.current?.scrollTo(0,0);}}).catch(e=>{if(active)setArticleError(e.message);}).finally(()=>{if(active)setReading(false);});return()=>{active=false;};},[selected,retry]);
 const open=(id:string)=>{if(id!==selected){setBack(values=>[...values,selected].filter(Boolean));setSelected(id);}setMobileArticle(true);};
 return <div className={`okf-reader ${mobileArticle?'show-article':''}`}>
  <aside className="okf-navigation"><div className="okf-library-heading"><h1>Library</h1><p>{total} concepts · Commerce knowledge</p></div>
   <label htmlFor="okf-search">Search knowledge</label><input id="okf-search" type="search" value={query} placeholder="Try warehouses or orders" onChange={e=>setQuery(e.target.value)}/>
   <label htmlFor="okf-category">Category</label><select id="okf-category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(value=><option key={value} value={value}>{labels[value]??value}</option>)}</select>
   <div className="okf-results" aria-label="Knowledge concepts">
    {loading?<p role="status">Searching…</p>:error?<EmptyState compact title="Library couldn’t be loaded" description={error} action={<button onClick={()=>setRetry(value=>value+1)}>Try again</button>}/>:!items.length?<EmptyState compact title="No matching concepts" description="Try another search or category." action={<button onClick={()=>{setQuery('');setCategory('');}}>Clear filters</button>}/>:<><p className="okf-result-count" role="status">{items.length} results</p>{items.map(item=><button className="okf-result" key={item.id} aria-current={selected===item.id?'page':undefined} onClick={()=>open(item.id)}><strong>{item.title}</strong><span>{labels[item.category]??item.category} · {item.bundle}</span></button>)}</>}
   </div>
  </aside>
  <article ref={scroll} className="okf-reading"><div className="okf-reader-toolbar"><button className="okf-mobile-browse" onClick={()=>setMobileArticle(false)}>Browse concepts</button>{back.length>0&&<button onClick={()=>{setSelected(back[back.length-1]);setBack(values=>values.slice(0,-1));}}>← Back</button>}<span>Open Knowledge Format</span></div>
   {reading?<p role="status">Loading article…</p>:articleError?<EmptyState title="This concept couldn’t be opened" description={articleError} action={<button onClick={()=>setRetry(value=>value+1)}>Try again</button>}/>:article?<div className="okf-article-content">
    <p className="okf-breadcrumb">{article.bundle} / {article.path}</p><h1>{article.title}</h1><p className="okf-article-type">{article.type}{article.metadata.product_status?` · Product status: ${article.metadata.product_status}`:''}</p>
    {!article.current&&<p className="okf-lifecycle-note">This concept is {article.origin==='upload'&&article.publication!=='published'?'an unpublished draft':article.metadata.status==='deprecated'?'deprecated':article.metadata.status==='draft'?'a draft':'stale'} and is excluded from Coach answers.</p>}
    <OKFArticle body={article.body} links={article.links} origin={article.origin} images={article.images} path={article.path} onOpen={open}/>
    {article.links.some(link=>link.id&&link.id!==selected)&&<section className="okf-related"><h2>Related concepts</h2>{[...new Map<string, Article["links"][number]>(article.links.filter(link=>link.id&&link.id!==selected).map(link=>[link.id!,link] as const)).values()].map(link=><button key={link.id} onClick={()=>open(link.id!)}>{link.title} →</button>)}</section>}
    <section className="okf-sources"><h2>Sources and provenance</h2>{(article.metadata.sources??[]).map((source:any,index:number)=>{const href=safeWebLink(source.resource);return <p key={index}>{href?<a href={href} target="_blank" rel="noopener noreferrer">{source.title??source.resource}</a>:source.title??source.resource}</p>;})}<p>Declared verification: {article.trust}. {article.metadata.generated?.by?`Generated by ${article.metadata.generated.by}.`:''}</p></section>
    <details className="okf-raw"><summary>View complete metadata</summary><pre>{JSON.stringify(article.metadata,null,2)}</pre></details>
   </div>:<EmptyState title="Choose a concept" description="Browse the categories or search for a topic to start reading."/>}
  </article>
 </div>;
}
