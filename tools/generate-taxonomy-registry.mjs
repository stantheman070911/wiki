#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);

const zhText = `
advertising=廣告
agency-model=代理商模式
ai=人工智慧
automation=自動化
avatar=客戶化身
barbell-strategy=槓鈴策略
believability=可信度
brand=品牌
business-model=商業模式
cac=顧客取得成本
capital=資本
career=職涯
cash-flow=現金流
chain-store=連鎖經營
channel-strategy=通路策略
churn=流失
commitment=承諾
compensation=薪酬
competition=競爭
consistency=一致性
content-formats=內容格式
content-pillars=內容支柱
content-strategy=內容策略
continuity=持續性
copywriting=文案寫作
courage=勇氣
creative-volume=創意產量
creativity=創造力
cta=行動呼籲
culture=文化
decision-making=決策
delegation=委派
differentiation=差異化
distribution=分發
diversification=多角化
do-things-that-dont-scale=做不可規模化之事
education=教育
efficiency=效率
email-marketing=電子郵件行銷
enterprise=企業
equity=股權
execution=執行
feedback=回饋
first-100k=第一個十萬
focus=專注
founder-brand=創辦人品牌
franchise=加盟
front-end-offer=前端產品
frugality=節儉
funnel=漏斗
growth=成長
happiness=幸福
hiring=招募
hooks=鉤子
idea-meritocracy=創意擇優
identity=身份認同
incentives=激勵
influence=影響力
influencer-marketing=網紅行銷
innovation=創新
inputs-vs-outputs=投入與產出
instagram=Instagram
ip=智慧財產
leadership=領導
learning=學習
leverage=槓桿
licensing=授權
local-services=在地服務
ltv=顧客終身價值
m-and-a=併購
management=管理
margins=利潤率
market-leader=市場領導者
market-saturation=市場飽和
marketing=行銷
memberships=會員制
mental-models=心智模型
messaging=訊息設計
mindset=心態
mission=使命
moat=護城河
monetization=變現
money=金錢
money-management=金錢管理
monopoly=壟斷
multi-unit=多單位經營
narrative=敘事
niche=利基
offers=產品提案
onboarding=導入
operations=營運
operations-manual=營運手冊
opportunity-cost=機會成本
optionality=選擇權
org-design=組織設計
owned-audience=自有受眾
paid-ads=付費廣告
parenting=教養
partnerships=合作夥伴
passive-income=被動收入
patience=耐心
persona=人設
personal-brand=個人品牌
persuasion=說服
positioning=定位
power-law=冪律
pricing=定價
prioritization=優先排序
private-domain=私域
product=產品
productivity=生產力
proof=證據
qualification=篩選
radical-transparency=徹底透明
reach=觸及
recruiting=人才招募
referrals=推薦
reps=重複練習
repurposing=內容再利用
reputation=聲譽
research=研究
retention=留存
risk=風險
root-cause=根本原因
rule-of-100=百次法則
sales=銷售
scaling=規模化
scriptwriting=腳本寫作
secrets=秘密
self-belief=自我信念
service-business=服務型商業
short-form-video=短影音
simplicity=簡單
simplification=簡化
skill-acquisition=技能習得
skills=技能
startups=新創
storytelling=說故事
supply-and-demand=供需
supply-chain=供應鏈
supply-constraint=供給約束
systems=系統
tam=總可服務市場
theory-of-constraints=限制理論
tiktok=TikTok
trust=信任
unit-economics=單位經濟
upsell=加購
value-creation=價值創造
value-equation=價值方程式
volume=數量
wealth=財富
writing=寫作`;

const zhLabels = new Map(zhText.trim().split('\n').map((line) => line.split('=')));
const synonymMap = new Map([
  ['avatar', 'customer avatar; ideal-customer avatar'],
  ['persona', 'public persona; creator persona'],
  ['owned-audience', 'owned media; direct audience'],
  ['private-domain', 'private traffic; 私域流量'],
  ['short-form-video', 'shorts; reels; short video'],
  ['simplicity', 'simple; minimalism'],
  ['simplification', 'complexity reduction; simplify'],
  ['leadership', 'leading; direction and influence'],
  ['management', 'managerial control; planning and coordination'],
  ['org-design', 'organization design; organizational structure'],
]);
const parentRules = [
  [/brand|positioning|differentiation|messaging|persona|reputation/, 'topic/brand'],
  [/content|copywriting|hooks|scriptwriting|storytelling|repurposing|writing|creative-volume/, 'topic/content-strategy'],
  [/pricing|offers|value-equation|upsell|front-end-offer|continuity/, 'topic/offers'],
  [/sales|funnel|onboarding|qualification|referrals/, 'topic/sales'],
  [/hiring|recruiting|compensation|delegation|management|leadership|culture/, 'topic/org-design'],
  [/risk|optionality|opportunity-cost|power-law|root-cause|prioritization/, 'topic/decision-making'],
  [/mindset|identity|self-belief|courage|patience|commitment|happiness/, 'topic/mindset'],
  [/operations|systems|efficiency|productivity|execution|focus|simplification/, 'topic/operations'],
  [/cash-flow|cac|ltv|margins|unit-economics/, 'topic/unit-economics'],
  [/personal-brand|founder-brand/, 'topic/personal-brand'],
  [/short-form-video|tiktok|instagram/, 'topic/content-formats'],
];

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}
function fm(text) { const end = text.indexOf('\n---', 4); return text.startsWith('---\n') && end > 0 ? text.slice(4, end) : ''; }
function value(frontmatter, key) { const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm')); return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''; }
function tags(frontmatter) { const match = frontmatter.match(/^tags:\s*\[(.*?)\]\s*$/m); return match ? match[1].split(',').map((tag) => tag.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []; }
function label(slug) { return slug.split('-').map((part) => ['ai', 'cac', 'cta', 'ip', 'ltv', 'tam'].includes(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }

const counts = new Map();
for (const file of walk(process.cwd())) {
  const frontmatter = fm(fs.readFileSync(file, 'utf8'));
  if (!knowledgeTypes.has(value(frontmatter, 'type'))) continue;
  for (const tag of tags(frontmatter)) counts.set(tag, (counts.get(tag) || 0) + 1);
}
const rows = [...counts].sort(([a], [b]) => a.localeCompare(b));
const topics = new Set(rows.filter(([tag]) => tag.startsWith('topic/')).map(([tag]) => tag));
for (const [tag] of rows.filter(([item]) => item.startsWith('topic/'))) {
  const slug = tag.slice(6);
  if (!zhLabels.has(slug)) throw new Error(`Missing Chinese label for ${tag}`);
}
function parent(tag) {
  if (!tag.startsWith('topic/')) return '';
  const slug = tag.slice(6);
  for (const [pattern, candidate] of parentRules) if (pattern.test(slug) && candidate !== tag && topics.has(candidate)) return candidate;
  return '';
}
function definition(tag) {
  const [facet, slug] = tag.split('/');
  if (facet === 'person') return `Sources or ideas attributed to ${label(slug)}.`;
  if (facet === 'source') return `Knowledge derived from the ${label(slug)} source or program.`;
  return `Knowledge where ${label(slug).toLowerCase()} is a central, reusable concept.`;
}
function include(tag) { return tag.startsWith('topic/') ? `Use when ${label(tag.slice(6)).toLowerCase()} materially shapes the page's framework, decision, or procedure.` : 'Use when this entity is part of the page provenance.'; }
function exclude(tag) { return tag.startsWith('topic/') ? 'Exclude incidental mentions; prefer a narrower active topic when it expresses the page more precisely.' : 'Exclude people or sources mentioned only as examples and not used as provenance.'; }
function esc(text) { return text.replace(/\|/g, '\\|'); }

const generatedOn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const tableRows = rows.map(([tag, count]) => {
  const [facet, slug] = tag.split('/');
  const zh = facet === 'topic' ? zhLabels.get(slug) : label(slug);
  return `| \`${tag}\` | ${label(slug)} | ${zh} | ${parent(tag) ? `\`${parent(tag)}\`` : '—'} | ${synonymMap.get(slug) || '—'} | active | ${count} | ${esc(definition(tag))} | ${esc(include(tag))} | ${esc(exclude(tag))} |`;
});

const output = `---
title: "Tag Registry"
type: "taxonomy-registry"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Tag Registry

This is the generated semantic registry for THE WIKI. Every active tag has a facet, bilingual label, lifecycle state, definition, inclusion rule, exclusion rule, optional parent, synonyms, and current usage count. Edit governance rules in \`tools/generate-taxonomy-registry.mjs\`, regenerate this page, then regenerate [[Topic-Index]].

## Rules

- Facets are \`topic/\`, \`person/\`, and \`source/\`.
- New tags begin as proposed and require an overlap check before activation.
- \`active\` is the preferred canonical spelling; synonyms aid discovery but are not added as parallel tags.
- Deprecated tags remain in the registry and generated deprecated-topic view until migration reaches zero uses.
- A tag is too broad when it does not materially narrow retrieval; it is too narrow when it represents a one-off phrase without a durable conceptual boundary. Prefer the nearest active parent in either case.
- Counts are evidence, not definitions.
- The canonical boundaries for the known overlapping clusters are also documented in [[Architecture Schema#Taxonomy boundaries]].

## Registry (${rows.length} tags)

| Tag | English label | Chinese label | Parent | Synonyms | State | Uses | Definition | Include when | Exclude when |
|---|---|---|---|---|---|---:|---|---|---|
${tableRows.join('\n')}

## Lifecycle

\`proposed\` → \`active\` → \`deprecated\` → \`merged\`. A merged tag records its preferred replacement in Synonyms or Parent and must have zero remaining page uses before removal from the generated topic index.
`;
fs.writeFileSync('_meta/Tags.md', output);
console.log(`Generated _meta/Tags.md: ${rows.length} governed tags (${topics.size} topics).`);
