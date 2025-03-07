// api/new-products/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    // MongoDB 연결
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("production");
    const collection = db.collection("items");
    
    // 새 제품 찾기 방법 1: isNew 필드 사용
    let newProducts = await collection.find({ 
      $or: [
        { isNew: true },
        { fridge: '새로 들어왔어요!' }
      ]
    })
    .sort({ createdAt: -1 })
    .toArray();
    
    // 만약 명시적으로 표시된 새 제품이 없으면, 최근 일주일 이내 추가된 제품으로 대체
    if (newProducts.length === 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      newProducts = await collection.find({
        createdAt: { $gte: oneWeekAgo }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
      
      // 새로 추가된 데이터에는 특별 표시 추가
      newProducts = newProducts.map(product => ({
        ...product,
        fridge: product.fridge || '새로 들어왔어요!'
      }));
    }
    
    // 결과가 없는 경우 적어도 하나의 제품 보여주기
    if (newProducts.length === 0) {
      newProducts = await collection.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
    }
    
    console.log(`새 상품 ${newProducts.length}개 반환`);
    
    // 결과 반환
    res.status(200).json(newProducts);
    
    // 연결 종료
    await client.close();
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.', 
      message: error.message 
    });
  }
}