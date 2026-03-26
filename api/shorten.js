import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { shortId, url } = req.body;
    if (!shortId || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if the custom name already exists globally
    const existing = await redis.get(shortId);
    if (existing) {
      return res.status(400).json({ error: 'That custom name is already taken globally. Please choose another.' });
    }
    
    // Save to Redis Database
    await redis.set(shortId, url);
    return res.status(200).json({ success: true, shortId, url });
    
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to connect to global database.' });
  }
}
