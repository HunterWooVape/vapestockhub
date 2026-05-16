const SITE_URL = process.env.SITE_URL || 'https://www.vapestockhub.com';

const testPages = [
  { path: '/', expectedStatus: 200, contains: 'VapeStockHub' },
  { path: '/inventory', expectedStatus: 200, contains: 'Inventory' },
  { path: '/health', expectedStatus: 200, contains: '"status":"ok"' },
  { path: '/admin', expectedStatus: 200, contains: '后台登录' },
  { path: '/go/telegram?sourcePageType=home&sourcePageSlug=test', expectedStatus: 307 },
];

async function runTests() {
  console.log(`🚀 Starting smoke tests on ${SITE_URL}...`);
  let failed = false;

  for (const test of testPages) {
    try {
      const url = `${SITE_URL}${test.path}`;
      const res = await fetch(url, { redirect: 'manual' });
      
      const statusMatch = res.status === test.expectedStatus;
      let contentMatch = true;
      let body = '';

      if (test.contains) {
        body = await res.text();
        contentMatch = body.includes(test.contains);
      }

      if (statusMatch && contentMatch) {
        console.log(`✅ [PASS] ${test.path} (Status: ${res.status})`);
      } else {
        failed = true;
        console.error(`❌ [FAIL] ${test.path}`);
        if (!statusMatch) console.error(`   Expected status ${test.expectedStatus}, got ${res.status}`);
        if (!contentMatch) console.error(`   Body did not contain: "${test.contains}"`);
      }
    } catch (err) {
      failed = true;
      console.error(`❌ [ERROR] ${test.path}: ${err.message}`);
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
