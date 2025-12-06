const fetch = require('node-fetch');

module.exports = async (req,res) => {
  if(req.method !== 'POST') return res.status(405).send('Method not allowed');
  const { text, style, breath, pause } = req.body;

  // 1. Convert user inputs to SSML-like hints for the model
  let ssml = text;
  
  // Breaths and Pauses handling
  if(breath) ssml = ssml.replace(/\,/g, ', <breath/>');
  if(pause === 'short') ssml = ssml.replace(/\./g, '. <break time="300ms"/>');
  if(pause === 'long') ssml = ssml.replace(/\./g, '. <break time="800ms"/>');

  // Add style markers (simple handling for VITS/XTTS like models)
  // Note: XTTS often handles emotion via specific tags or speaker reference, 
  // but we'll use a basic structure.
  
  // NOTE: For XTTS/VITS, style mapping is complex. We are sending text directly 
  // and hoping the JS logic for breath/pause works. We remove generic style tag 
  // as it often breaks the inference API for open models.

  try {
    // 2. Call HuggingFace Inference API with the correct model endpoint
    const HF_TOKEN = process.env.HF_TOKEN; // Vercel se automatic lega
    
    // IMPORTANT: Hindi TTS Model EndPoint FIX
    const MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/coqui/XTTS-v2';

    const hfRes = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: { 
          'Authorization': `Bearer ${HF_TOKEN}`, 
          'Content-Type': 'application/json' 
      },
      // XTTS/VITS often takes metadata + text. Here we are using simplified 
      // input that mostly relies on SSML embedded in the text.
      body: JSON.stringify({ 
          inputs: ssml, 
          parameters: { 
              // Example parameter to control voice or language, often required by XTTS
              // Check the specific model documentation on HuggingFace for correct parameters
              speaker: "Hindi Male/Female Voice Name", // Placeholder: use a real voice name if specified by XTTS
              language: "hi" // Hindi language code
          }
      })
    });

    if(!hfRes.ok){
      const txt = await hfRes.text();
      // Yahan Model ka error dikhega Vercel logs mein
      return res.status(500).send('Model error: ' + txt);
    }

    const arrayBuffer = await hfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type','audio/wav');
    res.send(buffer);
    
  } catch(err){
    console.error(err);
    res.status(500).send('Server error. Check Vercel logs.');
  }
}
