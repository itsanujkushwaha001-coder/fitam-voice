import fetch from 'node-fetch'; // 1. Dependency import

// 2. Vercel Serverless function export style
export default async function (req, res) { 
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  if (!req.body) {
      return res.status(400).send('Bad Request: Missing body');
  }

  const { text, style, breath, pause } = req.body;

  // 3. Convert user inputs to SSML-like hints
  let ssml = text;
  if (breath) ssml = ssml.replace(/\,/g, ', <breath/>');
  if (pause === 'short') ssml = ssml.replace(/\./g, '. <break time="300ms"/>');
  if (pause === 'long') ssml = ssml.replace(/\./g, '. <break time="800ms"/>');

  try {
    // 4. API Call
    const HF_TOKEN = process.env.HF_TOKEN; 
    const MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/coqui/XTTS-v2'; // Hindi TTS Model

    const hfRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      // 5. Model Parameters (Crucial for XTTS Hindi Voice)
      body: JSON.stringify({
        inputs: ssml,
        parameters: { 
            speaker: "Vikram", // Fixed Speaker Name for Hindi
            language: "hi" 
        }
      })
    });

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.error("HF Error:", txt);
      return res.status(500).send('Model error: ' + txt);
    }

    // 6. Return Audio
    const arrayBuffer = await hfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/wav');
    res.send(buffer);

  } catch (err) {
    console.error("Catch Error:", err);
    res.status(500).send('Server error. Please check Vercel Logs.');
  }
}
