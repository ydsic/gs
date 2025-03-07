// api/add-product/index.js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 요청 본문 파싱
    const productData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 기본 유효성 검사
    if (!productData.name || !productData.fridge) {
      return res.status(400).json({ error: '상품명과 구역은 필수 항목입니다.' });
    }

    // MongoDB 연결
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();

    // 데이터베이스 및 컬렉션 선택
    const db = client.db('production');
    const collection = db.collection('items');

    // 항목에 생성 시간 추가
    const itemToInsert = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // keywords 필드가 문자열로 들어온 경우 배열로 변환
    if (typeof itemToInsert.keywords === 'string') {
      itemToInsert.keywords = itemToInsert.keywords.split(',').map(k => k.trim());
    }

    // MongoDB에 데이터 삽입
    const result = await collection.insertOne(itemToInsert);

    // 연결 종료
    await client.close();

    // 성공 응답
    res.status(201).json({
      success: true,
      id: result.insertedId,
      message: '상품이 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    console.error('상품 추가 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.', message: error.message });
  }
}