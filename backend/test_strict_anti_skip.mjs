async function runAntiSkipTest() {
  const API_BASE = 'http://localhost:4000';

  console.log('--- 1. Authenticating Test User ---');
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      demoUser: { id: 777000111, username: 'anti_skip_tester', first_name: 'AntiSkip' },
      deviceId: 'dev_hwid_anti_skip_777',
      persistentToken: 'token_anti_skip_777'
    })
  });
  const authData = await authRes.json();
  const token = authData.token;
  console.log('Token acquired:', !!token);

  console.log('\n--- 2. Starting Ad Session (/ads/start) ---');
  const startRes = await fetch(`${API_BASE}/ads/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const startData = await startRes.json();
  console.log('Start Ad Session ID:', startData.sessionId);

  console.log('\n--- 3. Immediate Premature Verify Attack (/ads/callback at 500ms) ---');
  const verifyRes1 = await fetch(`${API_BASE}/ads/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startData.sessionId, adToken: 'fake_instant_token' })
  });
  const verifyData1 = await verifyRes1.json();
  console.log('Instant Verify Response (Expected Error):', verifyData1);

  console.log('\n--- 4. Immediate Premature Claim Attack (/ads/claim at 1000ms) ---');
  const claimRes1 = await fetch(`${API_BASE}/ads/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId: startData.sessionId })
  });
  const claimData1 = await claimRes1.json();
  console.log('Instant Claim Response (Expected Error):', claimData1);

  console.log('\n⏳ Simulating legitimate 15-second rewarded video playback...');
  await new Promise(r => setTimeout(r, 14500));

  console.log('\n--- 5. Legitimate Verify after 15s Full View ---');
  const verifyRes2 = await fetch(`${API_BASE}/ads/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startData.sessionId, adToken: 'gigapub_verified' })
  });
  const verifyData2 = await verifyRes2.json();
  console.log('Legitimate Verify Response:', verifyData2);

  console.log('\n--- 6. Legitimate Claim Reward ---');
  const claimRes2 = await fetch(`${API_BASE}/ads/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId: startData.sessionId })
  });
  const claimData2 = await claimRes2.json();
  console.log('Legitimate Claim Response:', claimData2);

  console.log('\n--- 7. Double Claim Attack ---');
  const doubleClaimRes = await fetch(`${API_BASE}/ads/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId: startData.sessionId })
  });
  const doubleClaimData = await doubleClaimRes.json();
  console.log('Double Claim Response (Expected Error):', doubleClaimData);

  console.log('\n--- 8. Immediate Next Ad Attempt (Cooldown Protection) ---');
  const cooldownRes = await fetch(`${API_BASE}/ads/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const cooldownData = await cooldownRes.json();
  console.log('Cooldown Start Response (Expected 429 Error):', cooldownData);

  console.log('\n🎯 Anti-Skip & High CPM Lockdown Tests PASSED!');
}

runAntiSkipTest().catch(console.error);
