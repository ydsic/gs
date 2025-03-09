// api/update-product/[id].js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // PUT 요청만 허용
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
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
  
  // 요청 본문 파싱 (add-product와 동일하게 처리)
  let productData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
  // 입력값 앞뒤 공백 제거
  if (typeof productData.name === 'string') {
    productData.name = productData.name.trim();
  }
  if (typeof productData.fridge === 'string') {
    productData.fridge = productData.fridge.trim();
  }
  
  // 필수 항목 검사
  if (!productData.name || !productData.fridge) {
    return res.status(400).json({ message: '상품명과 구역은 필수 항목입니다.' });
  }
  
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('production');
    const collection = db.collection('items');
    
    // 업데이트할 데이터 구성 (업데이트 시간 추가)
    const itemToUpdate = {
      ...productData,
      updatedAt: new Date()
    };
    // MongoDB에서 _id는 업데이트 불가하므로 제거
    delete itemToUpdate._id;
    
    // keywords 필드가 문자열이면 배열로 변환
    if (typeof itemToUpdate.keywords === 'string') {
      itemToUpdate.keywords = itemToUpdate.keywords.split(',').map(k => k.trim());
    }
    
    // MongoDB에서 데이터 업데이트
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: itemToUpdate }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '해당 ID의 상품을 찾을 수 없습니다.' });
    }
    
    return res.status(200).json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('상품 수정 API 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다: ' + error.message });
  } finally {
    await client.close();
  }
}
