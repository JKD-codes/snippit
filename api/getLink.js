import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });
    
    const url = await redis.get(id);
    if (url) {
      // Increment a global click counter for this ID
      await redis.incr(`${id}:clicks`);
      return res.status(200).json({ url });
    } else {
      return res.status(404).json({ error: 'Short link not found globally' });
    }
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Internal Database Error' });
  }
}
