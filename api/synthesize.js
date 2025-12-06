import fetch from 'node-fetch';

export default async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  if (!req.body) {
      return res.status(400).send('Bad Request: Missing body');
  }

  const { text } = req.body; // Ab sirf 'text' use kar rahe hain, 'style, breath, pause' nahi

  // SSML tags ko hata diya gaya hai, taaki model ko sirf seedha text mile.

  try {
    const HF_TOKEN = process.env.HF_TOKEN; 
    
    // FINAL WORKING MODEL ENDPOINT: Facebook MMS - Stable aur simple text support karta hai
    const MODEL_ENDPOINT = 'https://router.huggingface.co/models/facebook/mms-tts-hin';

    const hfRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
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
    res.setHeader('Content-Type', 'audio/wav');
    res.send(buffer);

  } catch (err) {
    console.error("Catch Error:", err);
    res.status(500).send('Server error. Final try.');
  }
}
