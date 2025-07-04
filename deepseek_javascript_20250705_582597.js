// In your HTML (temporary for development only)
const GEMINI_KEY = "AIzaSyDF_-8sNPoCD4d00vqFXNekomEtxMvd1M4"; // ⚠️ Never commit this!

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );
  return await response.json();
}
