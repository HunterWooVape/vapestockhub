const SITE_URL = process.env.SITE_URL || 'https://www.vapestockhub.com';

const testPages = [
  { name: 'Home', path: '/', expectedStatus: 200, contains: ['VapeStockHub'], linkPaths: ['/go/telegram', '/go/whatsapp'] },
  { name: 'Inventory index', path: '/inventory', expectedStatus: 200, contains: ['Wholesale Disposable Vapes in Bulk'] },
  { name: 'Cheap disposable vapes price band', path: '/price/under-3', expectedStatus: 200, contains: ['Cheap Disposable Vapes for Wholesale Clearance'] },
  { name: 'Blog index draft state', path: '/blog', expectedStatus: 200, contains: ['Wholesale Vape Sourcing Guides', 'noindex'] },
  {
    name: 'Geek Bar alternatives draft article',
    path: '/blog/geek-bar-alternatives-wholesale-buyers',
    expectedStatus: 200,
    contains: ['Geek Bar Alternatives for Wholesale Buyers', 'noindex'],
  },
  {
    name: 'Sitemap excludes draft Blog article',
    path: '/sitemap.xml',
    expectedStatus: 200,
    notContains: ['/blog/geek-bar-alternatives-wholesale-buyers'],
  },
  {
    name: 'Sitemap excludes Blog index without indexable articles',
    path: '/sitemap.xml',
    expectedStatus: 200,
    notContains: ['/blog</loc>'],
  },
  { name: 'Health route', path: '/health', expectedStatus: 200, contains: ['"status":"ok"'] },
  { name: 'Admin login', path: '/admin', expectedStatus: 200, contains: ['后台登录'] },
];

async function runTests() {
  console.log(`🚀 Starting smoke tests on ${SITE_URL}...`);
  let failed = false;

  for (const test of testPages) {
    try {
      const url = `${SITE_URL}${test.path}`;
      // Tracking GETs write business records. Check their hrefs without visiting them.
      if (new URL(url).pathname.startsWith('/go/')) {
        throw new Error('Smoke tests must not request tracking routes.');
      }
      const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      
      const statusMatch = res.status === test.expectedStatus;
      let body = '';

      if (test.contains || test.notContains || test.linkPaths) {
        body = await res.text();
      }

      const missingExpected = (test.contains ?? []).filter((text) => !body.includes(text));
      const unexpectedMatches = (test.notContains ?? []).filter((text) => body.includes(text));
      const contentMatch = missingExpected.length === 0;
      const absenceMatch = unexpectedMatches.length === 0;
      const linkPaths = [...body.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)]
        .flatMap((match) => {
          try {
            const target = new URL(match[1].replace(/&amp;/g, '&'), SITE_URL);
            return target.origin === new URL(SITE_URL).origin ? [target.pathname] : [];
          } catch {
            return [];
          }
        });
      const missingLinks = (test.linkPaths ?? []).filter((path) => !linkPaths.includes(path));

      if (statusMatch && contentMatch && absenceMatch && missingLinks.length === 0) {
        console.log(`✅ [PASS] ${test.name} (${test.path}, Status: ${res.status})`);
      } else {
        failed = true;
        console.error(`❌ [FAIL] ${test.name} (${test.path})`);
        if (!statusMatch) console.error(`   Expected status ${test.expectedStatus}, got ${res.status}`);
        for (const text of missingExpected) {
          console.error(`   Body did not contain: "${text}"`);
        }
        for (const text of unexpectedMatches) {
          console.error(`   Body should not contain: "${text}"`);
        }
        for (const path of missingLinks) {
          console.error(`   Missing same-site link: "${path}"`);
        }
      }
    } catch (err) {
      failed = true;
      console.error(`❌ [ERROR] ${test.name} (${test.path}): ${err.message}`);
    }
  }

  if (failed) {
    console.error('\n💥 Some smoke tests failed!');
    process.exit(1);
  } else {
    console.log('\n✨ All smoke tests passed!');
    process.exit(0);
  }
}

runTests();
