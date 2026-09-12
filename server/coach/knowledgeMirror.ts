import { createHash } from 'node:crypto';
import { KNOWLEDGE_BASE, type KnowledgeItem } from '../../src/coach/knowledgeBase';

export interface KnowledgeMirrorRecord {
  id: string;
  recordType: 'merchant-faq' | 'product-knowledge';
  feature: string;
  domain: string;
  question: string;
  answer: string;
  keywords: string[];
  translations: KnowledgeItem['translations'];
  productStatus: KnowledgeItem['status'];
  source: string;
  screenshotIds: string[];
  payload: KnowledgeItem;
  contentHash: string;
}

interface QueryClient {
  query(sql: string, values?: unknown[]): Promise<{ rowCount: number | null }>;
}

export function buildKnowledgeMirrorRecords(
  items: readonly KnowledgeItem[] = KNOWLEDGE_BASE,
): KnowledgeMirrorRecord[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (seen.has(item.id)) throw new Error(`Duplicate knowledge ID: ${item.id}`);
    seen.add(item.id);
    const payload = structuredClone(item);
    const serialized = JSON.stringify(payload);
    return {
      id: item.id,
      recordType: item.id.startsWith('merchant-faq-') ? 'merchant-faq' : 'product-knowledge',
      feature: item.feature,
      domain: item.domain,
      question: item.question,
      answer: item.answer,
      keywords: [...item.keywords],
      translations: item.translations ? structuredClone(item.translations) : {},
      productStatus: item.status,
      source: item.source,
      screenshotIds: [...(item.screenshotIds ?? [])],
      payload,
      contentHash: createHash('sha256').update(serialized).digest('hex'),
    };
  });
}

export async function syncKnowledgeMirror(
  client: QueryClient,
  records: readonly KnowledgeMirrorRecord[] = buildKnowledgeMirrorRecords(),
): Promise<{ active: number; merchantFaqs: number }> {
  await client.query('UPDATE public.coach_knowledge SET active=false WHERE active=true');
  for (const record of records) {
    await client.query(
      `INSERT INTO public.coach_knowledge (
        id,record_type,feature,domain,question,answer,keywords,translations,product_status,
        source,screenshot_ids,payload,content_hash,active,synced_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,now())
      ON CONFLICT(id) DO UPDATE SET
        record_type=excluded.record_type,feature=excluded.feature,domain=excluded.domain,
        question=excluded.question,answer=excluded.answer,keywords=excluded.keywords,
        translations=excluded.translations,product_status=excluded.product_status,source=excluded.source,
        screenshot_ids=excluded.screenshot_ids,payload=excluded.payload,content_hash=excluded.content_hash,
        active=true,synced_at=now()`,
      [
        record.id,
        record.recordType,
        record.feature,
        record.domain,
        record.question,
        record.answer,
        JSON.stringify(record.keywords),
        JSON.stringify(record.translations ?? {}),
        record.productStatus,
        record.source,
        JSON.stringify(record.screenshotIds),
        JSON.stringify(record.payload),
        record.contentHash,
      ],
    );
  }
  return {
    active: records.length,
    merchantFaqs: records.filter(({ recordType }) => recordType === 'merchant-faq').length,
  };
}
