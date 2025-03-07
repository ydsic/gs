// api/products/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    // 검색어 파라미터 가져오기 (있는 경우)
    const searchQuery = req.query.search || '';
    const fridgeFilter = req.query.fridge || '';
    
    // MongoDB 연결
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("production");
    const collection = db.collection("items");
    
    // 쿼리 조건 구성
    let query = {};
    
    // 검색어가 있으면 검색 조건 추가
    if (searchQuery) {
      // 키워드와 이름으로 검색
      query = {
        $or: [
          // 이름에 검색어 포함
          { name: { $regex: searchQuery, $options: 'i' } },
          // 키워드 배열에 검색어 포함
          { keywords: { $elemMatch: { $regex: searchQuery, $options: 'i' } } }
        ]
      };
    }
    
    // 특정 구역 필터링이 있으면 추가
    if (fridgeFilter) {
      query.fridge = fridgeFilter;
    }
    
    // 데이터 조회 (최신순)
    const products = await collection.find(query)
      .sort({ createdAt: -1 })
      .toArray();
      
    // 디버깅
    console.log(`검색어: "${searchQuery}", 구역: "${fridgeFilter}", 결과 수: ${products.length}`);
    
    // 결과 반환
    res.status(200).json(products);
    
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