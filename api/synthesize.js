import fetch from 'node-fetch';

export default async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  if (!req.body) {
      return res.status(400).send('Bad Request: Missing body');
  }

  const { text, style, breath, pause } = req.body;

  // Convert user inputs to SSML-like hints
  let ssml = text;
  if (breath) ssml = ssml.replace(/\,/g, ', <breath/>');
  if (pause === 'short') ssml = ssml.replace(/\./g, '. <break time="300ms"/>');
  if (pause === 'long') ssml = ssml.replace(/\./g, '. <break time="800ms"/>');

  try {
    const HF_TOKEN = process.env.HF_TOKEN; 
    // Hindi TTS Model Endpoint
const MODEL_ENDPOINT = 'https://router.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits';

    const hfRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      // Model Parameters (Crucial for XTTS Hindi Voice)
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
      // Detailed error message will be shown in Vercel logs
      return res.status(500).send('Model error: ' + txt); 
    }

    // Return Audio
    const arrayBuffer = await hfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/wav');
    res.send(buffer);

  } catch (err) {
    console.error("Catch Error:", err);
    res.status(500).send('Server error. Final try.');
  }
}
