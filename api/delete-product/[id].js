// api/delete-product/[id].js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // DELETE 요청만 허용
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
  
  // req.query에서 id 추출, 없으면 URL 마지막 부분에서 추출
  let { id } = req.query;
  if (!id || id === 'undefined') {
    const parts = req.url.split('/');
    id = parts[parts.length - 1];
  }
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: '상품 ID가 없습니다.' });
  }
  
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('production');
    const collection = db.collection('items');
    
    // MongoDB에서 데이터 삭제
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '해당 ID의 상품을 찾을 수 없습니다.' });
    }
    
    return res.status(200).json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('상품 삭제 API 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다: ' + error.message });
  } finally {
    await client.close();
  }
}
