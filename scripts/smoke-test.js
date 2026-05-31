const SITE_URL = process.env.SITE_URL || 'https://www.vapestockhub.com';

const testPages = [
  { name: 'Home', path: '/', expectedStatus: 200, contains: ['VapeStockHub'] },
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
  { name: 'Home Telegram tracking redirect', path: '/go/telegram?sourcePageType=home&sourcePageSlug=test', expectedStatus: 307 },
  { name: 'Blog Telegram tracking redirect', path: '/go/telegram?sourcePageType=blog&sourcePageSlug=geek-bar-alternatives-wholesale-buyers', expectedStatus: 307 },
];

async function runTests() {
  console.log(`🚀 Starting smoke tests on ${SITE_URL}...`);
  let failed = false;

  for (const test of testPages) {
    try {
      const url = `${SITE_URL}${test.path}`;
      const res = await fetch(url, { redirect: 'manual' });
      
      const statusMatch = res.status === test.expectedStatus;
      let body = '';

      if (test.contains || test.notContains) {
        body = await res.text();
      }

      const missingExpected = (test.contains ?? []).filter((text) => !body.includes(text));
      const unexpectedMatches = (test.notContains ?? []).filter((text) => body.includes(text));
      const contentMatch = missingExpected.length === 0;
      const absenceMatch = unexpectedMatches.length === 0;

      if (statusMatch && contentMatch && absenceMatch) {
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
