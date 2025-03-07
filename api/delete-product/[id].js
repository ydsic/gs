// api/delete-product/[id].js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // DELETE 요청만 허용
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  // 상품 ID 가져오기
  const { id } = req.query;
  
  if (!id || id === 'undefined') {
    return res.status(400).json({ error: '상품 ID가 없습니다.' });
  }

  try {
    // MongoDB 연결
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();

    // 데이터베이스 및 컬렉션 선택
    const db = client.db('production');
    const collection = db.collection('items');

    // MongoDB에서 데이터 삭제
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    // 연결 종료
    await client.close();

    // 삭제 결과 확인
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '해당 ID의 상품을 찾을 수 없습니다.' });
    }

    // 성공 응답
    res.status(200).json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('상품 삭제 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.', message: error.message });
  }
}