const API_URL = process.env.TEST_API || 'https://bonkearn.onrender.com';

async function runTest() {
  console.log(`\n🧪 Testing Multi-Account Anti-Sybil Defense against: ${API_URL}\n`);

  const mockDeviceSignature = 'dev_fp_iphone15_pro_' + Date.now();
  const mockPersistentToken = 'token_uuid_safari_' + Date.now();

  const userA = {
    demoUser: { id: 7001001, username: 'primary_user_alice', first_name: 'Alice' },
    deviceId: mockDeviceSignature,
    persistentToken: mockPersistentToken,
    referrerId: null
  };

  const userB_DifferentUser_SameDevice = {
    demoUser: { id: 7002002, username: 'duplicate_sybil_bob', first_name: 'Bob' },
    deviceId: mockDeviceSignature, // Same physical device!
    persistentToken: mockPersistentToken,
    referrerId: '7001001' // Trying to self-refer!
  };

  console.log('1️⃣ Registering Primary User (Alice - ID 7001001)...');
  const resA = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userA)
  });
  const dataA = await resA.json();
  console.log(`   Status: ${resA.status} (${resA.status === 200 ? '✅ APPROVED' : '❌ UNEXPECTED'})`);
  console.log(`   Response:`, dataA.user ? { id: dataA.user.id, balance: dataA.user.balance } : dataA);

  console.log('\n2️⃣ Attempting Registration for User B (Bob - ID 7002002) ON THE SAME DEVICE...');
  const resB = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userB_DifferentUser_SameDevice)
  });
  const dataB = await resB.json();
  console.log(`   Status: ${resB.status} (${resB.status === 403 ? '🛑 HARD REJECTED (403 FORBIDDEN)' : '⚠️ ALLOWED'})`);
  console.log(`   Error Message Received:`, dataB.error);

  console.log('\n3️⃣ Alice (Primary User) Logging Back In on her own device...');
  const resA_Login = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userA)
  });
  const dataA_Login = await resA_Login.json();
  console.log(`   Status: ${resA_Login.status} (${resA_Login.status === 200 ? '✅ ALLOWED ACCESS TO OWN ACCOUNT' : '❌ BLOCKED'})`);

  console.log('\n4️⃣ Attempting Registration for User C with same Persistent Storage Token...');
  const userC_SameToken = {
    demoUser: { id: 7003003, username: 'duplicate_cookie_charlie', first_name: 'Charlie' },
    deviceId: 'dev_fp_different_canvas_' + Date.now(),
    persistentToken: mockPersistentToken, // Same storage cookie/token!
    referrerId: '7001001'
  };
  const resC = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userC_SameToken)
  });
  const dataC = await resC.json();
  console.log(`   Status: ${resC.status} (${resC.status === 403 ? '🛑 HARD REJECTED (403 FORBIDDEN)' : '⚠️ ALLOWED'})`);
  console.log(`   Error Message Received:`, dataC.error);

  console.log('\n========================================');
  if (resA.status === 200 && resB.status === 403 && resA_Login.status === 200 && resC.status === 403) {
    console.log('🎉 ALL 4 TESTS PASSED! Multi-account duplicate creation is 100% BLOCKED!');
  } else {
    console.log('⚠️ Some tests failed. Please review.');
  }
  console.log('========================================\n');
}

runTest().catch(console.error);
