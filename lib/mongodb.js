// lib/mongodb.js
import { MongoClient } from 'mongodb';

// MongoDB 연결 URI 디버깅 (중요 정보는 부분적으로 가려서 출력)
const uri = process.env.MONGODB_URI;
if (uri) {
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('MongoDB URI 설정됨:', maskedUri);
} else {
  console.error('MongoDB URI가 설정되지 않았습니다!');
}

// 연결 옵션
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('MongoDB URI가 설정되지 않았습니다. .env.local 파일에 MONGODB_URI를 추가해주세요.');
}

// 개발 환경에서는 연결을 전역적으로 재사용
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 프로덕션 환경에서는 새 클라이언트 생성
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;