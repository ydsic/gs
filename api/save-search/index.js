// api/save-search/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // req.body가 문자열인 경우 JSON.parse로 파싱
    const { searchTerm } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ message: "검색어가 비어있습니다." });
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("production");
    // 검색 기록 전용 컬렉션 사용 (searchLogs)
    const collection = db.collection("searchLogs");
    const result = await collection.insertOne({
      searchTerm: searchTerm.trim(),
      createdAt: new Date()
    });
    await client.close();
    return res.status(201).json({ success: true, id: result.insertedId, message: "검색어 저장 완료" });
  } catch (error) {
    console.error('검색어 저장 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다: ' + error.message });
  }
}
