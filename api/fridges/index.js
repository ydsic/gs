// api/fridges/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    // MongoDB 연결
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("production");
    const collection = db.collection("items");
    
    // 구역(fridge) 필드의 고유한 값 목록 조회
    const fridges = await collection.distinct("fridge");
    
    // 미리 정의된 구역 순서
    const fridgeOrder = [
      '1번 냉장고', '2번 냉장고', '3번 냉장고', '4번 냉장고', '5번 냉장고',
      '1번 진열대 12시 방향', '1번 진열대 3시 방향', '1번 진열대 6시 방향', '1번 진열대 9시 방향',
      '2번 진열대 12시 방향', '2번 진열대 3시 방향', '2번 진열대 6시 방향', '2번 진열대 9시 방향',
      '3번 진열대 12시 방향', '3번 진열대 3시 방향', '3번 진열대 6시 방향', '3번 진열대 9시 방향',
      '4번 진열대 (삼각김밥 앞)', '5번 진열대 (삼각김밥 앞)', '6번 진열대 (전자레인지 오른쪽)',
      '1번 냉동고 (5번 냉장고 오른쪽)', '2번 냉동고 (카운터 왼쪽)', '3번 냉동고 (카운터 왼쪽)', '4번 냉동고 (바깥에 있는 냉동고)',
      '1번 FF (단백질 음료, 우유)', '2번 FF (컵 커피, 요플레)', '3번 FF (핫바)', '4번 FF (컵떡볶이, 우동)', '5번 FF (삼각김밥, 햄버거)',
      'FF 하단', '계산대 (직원문의)', '온장고', '새로 들어왔어요!'
    ];
    
    // 구역 정보 정렬 (정의된 순서대로)
    const sortedFridges = fridges.sort((a, b) => {
      const indexA = fridgeOrder.indexOf(a);
      const indexB = fridgeOrder.indexOf(b);
      
      // 정의된 순서에 없는 항목은 뒤로
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    // 각 구역별 상품 개수 집계
    const fridgeStats = await Promise.all(sortedFridges.map(async (fridge) => {
      const count = await collection.countDocuments({ fridge });
      return { name: fridge, productCount: count };
    }));
    
    console.log(`${fridgeStats.length}개 구역 정보 반환`);
    
    // 결과 반환
    res.status(200).json(fridgeStats);
    
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