import { ImageResponse } from 'next/og'
import { SITE_CONFIG } from '@/lib/metadata'
 
export const runtime = 'edge'
 
export const alt = SITE_CONFIG.name
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b  100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo/Icon placeholder */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 48,
              fontWeight: 'bold',
            }}
          >
            LoL
          </div>
        </div>
        
        {/* Title */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {SITE_CONFIG.name}
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          Track your Arena mode progress, discover champion synergies, and monitor your 2v2v2v2 match history
        </div>
        
        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 40,
          }}
        >
          {['Champion Tracking', 'Match History', 'Progress Stats'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 8,
                padding: '12px 24px',
                color: '#60a5fa',
                fontSize: 18,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
