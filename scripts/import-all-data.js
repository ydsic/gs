// scripts/import-all-data.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// 구역명 매핑 함수 (파일명 -> 구역명)
function getFridgeName(filePath) {
  const fridgeMap = {
    '/data/fridge1.json': '1번 냉장고',
    '/data/fridge2.json': '2번 냉장고',
    '/data/fridge3.json': '3번 냉장고',
    '/data/fridge4.json': '4번 냉장고',
    '/data/fridge5.json': '5번 냉장고',
    '/data/shelf1_12.json': '1번 진열대 12시 방향',
    '/data/shelf1_3.json': '1번 진열대 3시 방향',
    '/data/shelf1_6.json': '1번 진열대 6시 방향',
    '/data/shelf1_9.json': '1번 진열대 9시 방향',
    '/data/shelf2_12.json': '2번 진열대 12시 방향',
    '/data/shelf2_3.json': '2번 진열대 3시 방향',
    '/data/shelf2_6.json': '2번 진열대 6시 방향',
    '/data/shelf2_9.json': '2번 진열대 9시 방향',
    '/data/shelf3_12.json': '3번 진열대 12시 방향',
    '/data/shelf3_3.json': '3번 진열대 3시 방향',
    '/data/shelf3_6.json': '3번 진열대 6시 방향',
    '/data/shelf3_9.json': '3번 진열대 9시 방향',
    '/data/shelf4.json': '4번 진열대 (삼각김밥 앞)',
    '/data/shelf5.json': '5번 진열대 (삼각김밥 앞)',
    '/data/shelf6.json': '6번 진열대 (전자레인지 오른쪽)',
    '/data/freezer1.json': '1번 냉동고 (5번 냉장고 오른쪽)',
    '/data/freezer2.json': '2번 냉동고 (카운터 왼쪽)',
    '/data/freezer3.json': '3번 냉동고 (카운터 왼쪽)',
    '/data/freezer4.json': '4번 냉동고 (바깥에 있는 냉동고)',
    '/data/ff1.json': '1번 FF (단백질 음료, 우유)',
    '/data/ff2.json': '2번 FF (컵 커피, 요플레)',
    '/data/ff3.json': '3번 FF (핫바)',
    '/data/ff4.json': '4번 FF (컵떡볶이, 우동)',
    '/data/ff5.json': '5번 FF (삼각김밥, 햄버거)',
    '/data/ffunder.json': 'FF 하단',
    '/data/casher.json': '계산대 (직원문의)',
    '/data/warmer.json': '온장고',
    '/data/new.json': '새로 들어왔어요!'
  };
  
  // 파일 경로에서 파일명만 추출 (Windows/Linux 호환성 고려)
  const fileName = filePath.split(path.sep).pop();
  const key = '/data/' + fileName;
  return fridgeMap[key] || '알 수 없는 구역';
}

async function importAllData() {
  try {
    console.log('MongoDB 연결 시도 중...');
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');

    const db = client.db('production');
    const collection = db.collection('items');
    
    // 기존 데이터 개수 확인
    const existingCount = await collection.countDocuments();
    console.log(`현재 컬렉션에 ${existingCount}개의 데이터가 있습니다.`);
    
    // 기존 데이터 삭제 여부 확인 (있을 경우에만)
    if (existingCount > 0) {
      console.log('기존 데이터를 삭제합니다...');
      await collection.deleteMany({});
      console.log('기존 데이터가 삭제되었습니다.');
    }

    // 데이터 파일 경로 설정
    const dataFolder = path.join(__dirname, '../data'); // 실제 데이터 폴더 경로로 수정하세요
    console.log(`데이터 폴더: ${dataFolder}`);
    
    // 폴더 존재 여부 확인
    if (!fs.existsSync(dataFolder)) {
      throw new Error(`데이터 폴더가 존재하지 않습니다: ${dataFolder}`);
    }
    
    // JSON 파일 목록 가져오기
    const files = fs.readdirSync(dataFolder).filter(file => file.endsWith('.json'));
    console.log(`${files.length}개의 JSON 파일을 찾았습니다.`);
    
    let totalImported = 0;
    let fileProcessed = 0;
    
    // 각 파일 처리
    for (const file of files) {
      try {
        fileProcessed++;
        const filePath = path.join(dataFolder, file);
        console.log(`[${fileProcessed}/${files.length}] ${file} 처리 중...`);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        if (data && data[""] && Array.isArray(data[""])) {
          const fridgeName = getFridgeName(file);
          console.log(`  구역명: ${fridgeName}`);
          
          // 각 상품에 구역 정보와 생성 시간 추가
          const productsWithLocation = data[""].map(product => ({
            ...product,
            fridge: fridgeName,
            createdAt: new Date(),
            // 새 제품 표시 여부 (new.json인 경우에만)
            isNew: file === 'new.json' ? true : false
          }));

          if (productsWithLocation.length > 0) {
            const result = await collection.insertMany(productsWithLocation);
            console.log(`  ${result.insertedCount}개 상품 추가됨`);
            totalImported += result.insertedCount;
          } else {
            console.log('  추가할 상품이 없습니다.');
          }
        } else {
          console.warn(`  ${file}: 올바른 데이터 형식이 아닙니다.`);
        }
      } catch (error) {
        console.error(`  ${file} 처리 중 오류:`, error.message);
      }
    }

    console.log(`\n데이터 가져오기 완료!`);
    console.log(`총 ${totalImported}개의 상품이 MongoDB에 추가되었습니다.`);
    
    // 인덱스 생성 (검색 성능 향상)
    console.log('검색 인덱스 생성 중...');
    await collection.createIndex({ name: "text", keywords: "text" });
    await collection.createIndex({ fridge: 1 });
    await collection.createIndex({ createdAt: -1 });
    console.log('인덱스 생성 완료');
    
  } catch (error) {
    console.error('데이터 가져오기 오류:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결을 닫았습니다.');
  }
}

// 스크립트 실행
console.log('데이터 가져오기 스크립트 시작...');
importAllData();