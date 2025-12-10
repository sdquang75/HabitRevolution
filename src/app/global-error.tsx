'use client'; // Bắt buộc phải có dòng này ở đầu

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>
            Hệ thống gặp sự cố nghiêm trọng
          </h2>
          <p style={{ color: '#666' }}>Chúng tôi đang xử lý vấn đề này.</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#1677ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Thử lại ngay
          </button>
        </div>
      </body>
    </html>
  );
}