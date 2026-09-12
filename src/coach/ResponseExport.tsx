import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ChatMessage } from './responseEngine';
import { renderMarkdown } from './MarkdownRenderer';
import { screenshotUrl } from './screenshotAssets';
import { downloadResponse, renderResponseImage } from './export/responseExport';

export function ResponseExport({ message }: { message: ChatMessage }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  if (message.role !== 'assistant' || message.type === 'error') return null;
  const copyImage = async () => {
    setBusy(true); setError(''); setCopied(false);
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Image copying is unavailable in this browser. Use PNG to download instead.');
      }
      // Start the clipboard write during the click; async rendering must not lose
      // the user activation required by browsers such as Safari.
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': renderResponseImage(message) }),
      ]);
      setCopied(true);
    } catch (error) {
      setError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Clipboard access was blocked. Allow clipboard access and try again, or download PNG.'
        : error instanceof Error ? error.message : 'Could not copy the image. Try PNG instead.');
    } finally { setBusy(false); }
  };
  const png = async () => {
    setBusy(true); setError('');
    try { downloadResponse(await renderResponseImage(message)); }
    catch (error) { setError(error instanceof Error ? error.message : 'Export failed. Please try again.'); }
    finally { setBusy(false); }
  };
  const pdf = () => {
    setError('');
    const preview = window.open('', '_blank');
    if (!preview) { setError('Allow pop-ups to open the PDF preview.'); return; }
    preview.opener = null;
    preview.document.title = 'Commerce Coach answer';
    // React escapes answer content; never write generated answers as raw HTML.
    for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) preview.document.head.appendChild(sheet.cloneNode(true));
    const style = preview.document.createElement('style');
    style.textContent = 'html,body{background:white!important;color:#20252d!important}body{padding:32px;font:16px/1.8 "Noto Sans Bengali Variable",sans-serif;max-width:850px;margin:auto}img{width:100%;height:auto}figure{margin:24px 0;break-inside:avoid}h1{font-size:24px}button{padding:10px 16px;border:1px solid #bbb;border-radius:8px;cursor:pointer}@media print{.export-controls{display:none}body{padding:0;max-width:none}@page{size:A4;margin:18mm}}';
    preview.document.head.appendChild(style);
    createRoot(preview.document.body).render(<>
      <div className="export-controls"><button onClick={() => preview.print()}>Print / Save as PDF</button><p>Choose “Save as PDF” in the print dialog, then attach the saved file in WhatsApp.</p></div>
      <h1>Commerce Coach</h1>
      {message.metadata?.feature && <h2>{message.metadata.feature}</h2>}
      <article>{renderMarkdown(message.content)}</article>
      {message.metadata?.source && <p>Source: {message.metadata.source}</p>}
      {message.metadata?.confidence === 'low' && <p>Needs confirmation</p>}
      {(message.metadata?.screenshots ?? []).map((screen, index) => <figure key={index}><figcaption>{screen.caption}</figcaption><img src={new URL(screenshotUrl(screen.src), window.location.href).href} alt={screen.caption} onError={event => { event.currentTarget.alt = 'Screenshot could not load. Close this preview and try again.'; }}/></figure>)}
    </>);
  };
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    <button type="button" onClick={copyImage} disabled={busy} className="rounded border px-2 py-1" title="Copy answer and screenshots as an image to paste into WhatsApp">Copy image</button>
    <button type="button" onClick={pdf} disabled={busy} className="rounded border px-2 py-1" title="Open printable answer and save as PDF">PDF</button>
    <button type="button" onClick={png} disabled={busy} className="rounded border px-2 py-1">{busy ? 'Exporting…' : 'PNG'}</button>
    {error && <span role="alert" className="text-red-600">{error}</span>}
    {copied && <span role="status" className="text-emerald-700">Image copied — ready to paste</span>}
  </div>;
}
