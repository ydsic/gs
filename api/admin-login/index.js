// api/admin-login/index.js
export default function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 요청 본문 파싱 (문자열 또는 객체 모두 처리)
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const password = data.password;
    
    // 비밀번호가 제공되었는지 확인
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: '비밀번호가 제공되지 않았습니다.' 
      });
    }
    
    // 환경 변수에서 설정된 비밀번호 가져오기
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // 임시 대체 비밀번호 (환경 변수가 설정되지 않은 경우)
    const fallbackPassword = 'admin1234';
    
    if (!adminPassword) {
      console.warn('ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다. 기본 비밀번호를 사용합니다.');
    }
    
    // 비밀번호 확인 (환경 변수 또는 대체 비밀번호)
    if (password === (adminPassword || fallbackPassword)) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: '비밀번호가 올바르지 않습니다.' 
      });
    }
  } catch (error) {
    console.error('관리자 로그인 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다: ' + error.message 
    });
  }
}