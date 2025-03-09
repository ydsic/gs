// api/get-searches/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("production");
    const collection = db.collection("searchLogs");
    const searches = await collection.find({})
      .sort({ createdAt: -1 })
      .toArray();
    await client.close();
    return res.status(200).json(searches);
  } catch (error) {
    console.error('검색 기록 불러오기 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다: ' + error.message });
  }
}
