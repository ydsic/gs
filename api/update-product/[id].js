// api/update-product/[id].js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // PUT 요청만 허용
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  // 상품 ID 가져오기
  const { id } = req.query;
  
  if (!id || id === 'undefined') {
    return res.status(400).json({ error: '상품 ID가 없습니다.' });
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

    // 항목에 업데이트 시간 추가
    const itemToUpdate = {
      ...productData,
      updatedAt: new Date()
    };

    // _id 필드 제거 (MongoDB에서 _id는 업데이트 불가)
    delete itemToUpdate._id;

    // keywords 필드가 문자열로 들어온 경우 배열로 변환
    if (typeof itemToUpdate.keywords === 'string') {
      itemToUpdate.keywords = itemToUpdate.keywords.split(',').map(k => k.trim());
    }

    // MongoDB에서 데이터 업데이트
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: itemToUpdate }
    );

    // 연결 종료
    await client.close();

    // 업데이트 결과 확인
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: '해당 ID의 상품을 찾을 수 없습니다.' });
    }

    // 성공 응답
    res.status(200).json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('상품 수정 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.', message: error.message });
  }
}