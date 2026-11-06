import fs from 'fs';
const root = '/home/prince/orbit-web-designs/dist';
const pages = [];
const walk = (d) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) {
  const p = d + '/' + e.name;
  if (e.isDirectory()) walk(p);
  else if (e.name === 'index.html') pages.push(p);
} };
walk(root);
const out = [];
for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  const rel = p.slice(root.length + 1, -'/index.html'.length) || '/';
  const g = (re) => (h.match(re) || [])[1];
  const title = (g(/<title>([^<]*)<\/title>/) || '').trim();
  const desc = (g(/<meta name="description" content="([^"]*)"/) || '').trim();
  const checks = {
    title: title.length >= 15 && title.length <= 68,
    desc: desc.length >= 70 && desc.length <= 170,
    canonical: /rel="canonical"/.test(h),
    ogimg: /property="og:image"/.test(h),
    ogtitle: /property="og:title"/.test(h),
    twcard: /name="twitter:card"/.test(h),
    h1: (h.match(/<h1[\s>]/g) || []).length === 1,
    jsonld: h.includes('application/ld+json'),
    imgalt: !/<img(?![^>]*\salt=)[^>]*>/.test(h),
    robotsNoindex: !/name="robots" content="noindex/.test(h),
    charset: /charset/.test(h) || /<meta charset/.test(h),
  };
  if (rel.includes('card') || rel.includes('404') || rel.includes('indexnow')) continue;
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) out.push(`${rel}: ${bad.join(',')} | t[${title.length}] d[${desc.length}]`);
}
console.log(`pages scanned: ${pages.length}`);
console.log(out.length ? out.join('\n') : 'ALL PAGES PASS');
