import fetch from 'node-fetch';

export default async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  if (!req.body) {
      return res.status(400).send('Bad Request: Missing body');
  }

  const { text } = req.body; // Ab sirf 'text' use kar rahe hain

  try {
    const HF_TOKEN = process.env.HF_TOKEN; 
    
    // FINAL WORKING MODEL ENDPOINT: Facebook MMS - Stable model
    const MODEL_ENDPOINT = 'https://router.huggingface.co/models/facebook/mms-tts-hin';

    const hfRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/flac' // <--- Final Header Fix
      },
      // FINAL BODY FIX: MMS model sirf seedha text leta hai
      body: JSON.stringify({
        inputs: text 
      })
    });

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.error("HF Error:", txt);
      return res.status(500).send('Model error: ' + txt); 
    }

    // Return Audio
    const arrayBuffer = await hfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/flac'); // Content-Type ko bhi FLAC karna zaroori hai
    res.send(buffer);

  } catch (err) {
    console.error("Catch Error:", err);
    res.status(500).send('Server error. Final try.');
  }
}
