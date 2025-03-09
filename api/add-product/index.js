// api/add-product/index.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const productData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!productData.name || !productData.fridge) {
      return res.status(400).json({ error: '상품명과 구역은 필수 항목입니다.' });
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('production');
    const collection = db.collection('items');

    // isNew 체크박스 값이 있다면 true로, 없으면 false로 저장
    const itemToInsert = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isNew: productData.isNew ? true : false
    };

    if (typeof itemToInsert.keywords === 'string') {
      itemToInsert.keywords = itemToInsert.keywords.split(',').map(k => k.trim());
    }

    const result = await collection.insertOne(itemToInsert);
    await client.close();

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
