const fetch = require('node-fetch');

async function fixProgress() {
  try {
    const response = await fetch('http://localhost:3001/api/debug/fix-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: '176207576',
        businessId: 'cmfr2y0ia0000eyvw7ef3k20u'
      })
    });
    
    const result = await response.json();
    console.log('✅ Resultado:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixProgress();
