import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(17,24,39,0.06)',
        }}
      >
        <div style={{ width: '64px', height: '64px', display: 'flex' }}>
          <div
            style={{
              width: '32px',
              height: '64px',
              background: '#8CC63F',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '16px',
                width: '18px',
                height: '18px',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '999px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '10px',
                top: '38px',
                width: '14px',
                height: '10px',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '999px',
              }}
            />
          </div>
          <div
            style={{
              width: '32px',
              height: '64px',
              background: '#6A2D7A',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '7px',
                top: '16px',
                width: '18px',
                height: '18px',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '999px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '10px',
                top: '38px',
                width: '14px',
                height: '10px',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}


