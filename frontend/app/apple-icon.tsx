import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '40px',
          overflow: 'hidden',
          border: '1px solid rgba(17,24,39,0.06)',
        }}
      >
        <div style={{ width: '180px', height: '180px', display: 'flex' }}>
          <div style={{ width: '90px', height: '180px', background: '#8CC63F' }} />
          <div style={{ width: '90px', height: '180px', background: '#6A2D7A' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}


