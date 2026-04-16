// ─────────────────────────────────────────────────────────────────
//  Quiz payload test — run with: node test.js
//  Validates the payload structure and POSTs to GAS.
//  Results written to test-results.json.
// ─────────────────────────────────────────────────────────────────

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwh1Evkv-inK9nRz5YPXNvcnH8FtLwMneHiFWAxKMqTm36TSKfwU1ePOp_PUlJR0hTR/exec';

// ── Simulate a completed quiz submission ─────────────────────────
const payload = {
  name:  'Test User',
  phone: '+91 9876543210',
  email: 'testuser@example.com',
  q1:    'Intermediate',
  q2:    '₹1,00,000',
  q3:    'Business Owner',
  q4:    'Balanced',
  q5:    'Evening',
};

// ── Validate all required fields ─────────────────────────────────
const errors = [];
if (!payload.name  || payload.name.length < 2)              errors.push('name: too short');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))     errors.push('email: invalid format');
if (!/^\+91\s?[6-9]\d{9}$/.test(payload.phone))            errors.push('phone: invalid Indian format');
['q1','q2','q3','q4','q5'].forEach(k => {
  if (!payload[k]) errors.push(`${k}: missing`);
});

const result = {
  timestamp:    new Date().toISOString(),
  payload,
  validation:   errors.length === 0 ? 'PASS' : 'FAIL',
  errors,
  gasResponse:  null,
  gasStatus:    null,
};

console.log('\n── Payload ─────────────────────────────');
console.log(JSON.stringify(payload, null, 2));
console.log('\n── Validation:', result.validation);
if (errors.length) errors.forEach(e => console.error('  ✗', e));
else console.log('  ✓ All fields valid');

// ── POST to GAS as URLSearchParams ───────────────────────────────
const body = new URLSearchParams(payload).toString();
const url  = new URL(GAS_URL);

const options = {
  hostname: url.hostname,
  path:     url.pathname + url.search,
  method:   'POST',
  headers:  {
    'Content-Type':   'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('\n── Sending POST to GAS…');

function saveAndPrint() {
  const outPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('\n── Results saved to test-results.json');
  console.log('── Done.\n');
}

// Step 1: POST to GAS (doPost runs here; GAS returns 302 to echo URL)
// Step 2: Follow redirect with GET to read the JSON response body
function getFrom(echoUrl) {
  const u = new URL(echoUrl);
  https.get({ hostname: u.hostname, path: u.pathname + u.search }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      result.gasStatus   = res.statusCode;
      result.gasResponse = raw || '(empty body)';
      console.log('  Echo status :', res.statusCode);
      console.log('  GAS response:', result.gasResponse.slice(0, 300));
      saveAndPrint();
    });
  }).on('error', (err) => {
    result.gasResponse = err.message;
    result.gasStatus   = 'ECHO_ERROR';
    console.error('  ✗ Echo GET error:', err.message);
    saveAndPrint();
  });
}

const req = https.request(options, (res) => {
  if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
    console.log(`  → GAS redirected (${res.statusCode}) — doPost executed, reading response…`);
    // consume the redirect body so the socket is freed
    res.resume();
    return getFrom(res.headers.location);
  }
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    result.gasStatus   = res.statusCode;
    result.gasResponse = raw || '(empty body)';
    console.log('  Status :', res.statusCode);
    console.log('  Body   :', result.gasResponse.slice(0, 300));
    saveAndPrint();
  });
});

req.on('error', (err) => {
  result.gasResponse = err.message;
  result.gasStatus   = 'ERROR';
  console.error('  ✗ Request error:', err.message);
  saveAndPrint();
});

req.write(body);
req.end();
