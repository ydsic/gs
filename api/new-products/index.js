// api/new-products/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("production");
    const collection = db.collection("items");

    // isNew가 true인 상품만 반환 (최신순 정렬)
    const newProducts = await collection.find({ isNew: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(newProducts);
    await client.close();
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.', message: error.message });
  }
}
