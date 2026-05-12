import { useEffect, useRef } from 'react'
import type { Itinerary, ItineraryDay, Activity } from '../types'
import type { ItineraryStatus } from '../hooks/useItinerary'

interface ItineraryModalProps {
  status: ItineraryStatus
  itinerary: Itinerary | null
  error: string | null
  destinationName: string
  onClose: () => void
  onRetry: () => void
}

const CATEGORY_ICON: Record<string, string> = {
  景点: '🏛️',
  美食: '🍽️',
  购物: '🛍️',
  交通: '🚌',
  住宿: '🏨',
}

export default function ItineraryModal({
  status,
  itinerary,
  error,
  destinationName,
  onClose,
  onRetry,
}: ItineraryModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 行程渲染完成后滚到顶部
  useEffect(() => {
    if (status === 'done' && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [status])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="glass fade-in-up"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '88vh',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {itinerary?.title || `${destinationName} 行程规划`}
            </div>
            {status === 'generating' && (
              <div style={{ fontSize: '13px', color: '#4f8ef7', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <InlineSpinner />
                AI 规划中，请稍候...
              </div>
            )}
            {status === 'done' && (
              <div style={{ fontSize: '13px', color: '#34d399', marginTop: '4px' }}>
                ✓ 行程生成完成
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Generating state: loading animation only, no raw reasoning text */}
          {status === 'generating' && <GeneratingPlaceholder />}

          {/* Error state */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                生成失败
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {error}
              </div>
              <button
                onClick={onRetry}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                重新生成
              </button>
            </div>
          )}

          {/* Done state: render full itinerary */}
          {status === 'done' && itinerary && (
            <ItineraryView itinerary={itinerary} />
          )}
        </div>
      </div>
    </div>
  )
}

function GeneratingPlaceholder() {
  return (
    <div style={{ padding: '40px 0' }}>
      {/* 脉冲动画骨架屏 */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .skel { border-radius: 8px; background: rgba(79,142,247,0.15); animation: pulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* 顶部摘要块 */}
      <div className="skel" style={{ height: '80px', marginBottom: '24px', animationDelay: '0s' }} />

      {/* 模拟 Day 卡片 × 2 */}
      {[0, 1].map((i) => (
        <div key={i} style={{ marginBottom: '16px', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="skel" style={{ height: '44px', borderRadius: 0, animationDelay: `${i * 0.2}s` }} />
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1, 2].map((j) => (
              <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div className="skel" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, animationDelay: `${(i + j) * 0.15}s` }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ height: '14px', width: '60%', marginBottom: '6px', animationDelay: `${(i + j) * 0.15 + 0.05}s` }} />
                  <div className="skel" style={{ height: '12px', width: '85%', animationDelay: `${(i + j) * 0.15 + 0.1}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        AI 正在为你规划专属行程...
      </div>
    </div>
  )
}

function ItineraryView({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div>
      {/* Summary */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(79,142,247,0.08)',
          border: '1px solid rgba(79,142,247,0.2)',
          marginBottom: '20px',
        }}
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
          {itinerary.summary}
        </p>
      </div>

      {/* Days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        {itinerary.days.map((day) => (
          <DayCard key={day.day} day={day} />
        ))}
      </div>

      {/* Budget tips */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.2)',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399', marginBottom: '8px', letterSpacing: '0.06em' }}>
          💰 预算建议
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
          {itinerary.budgetTips}
        </p>
      </div>

      {/* Best time */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.2)',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa', marginBottom: '8px', letterSpacing: '0.06em' }}>
          🌤 最佳游览时间
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
          {itinerary.bestTime}
        </p>
      </div>
    </div>
  )
}

function DayCard({ day }: { day: ItineraryDay }) {
  return (
    <div
      style={{
        borderRadius: '14px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Day header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {day.day}
        </span>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          第 {day.day} 天 · {day.theme}
        </span>
      </div>

      {/* Activities */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {day.activities.map((act, i) => (
          <ActivityCard key={i} activity={act} />
        ))}
      </div>
    </div>
  )
}

function ActivityCard({ activity: act }: { activity: Activity }) {
  const icon = CATEGORY_ICON[act.category] || '📍'
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(act.mapQuery)}`

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ flexShrink: 0, width: '32px', textAlign: 'center' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{act.time}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{act.name}</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
            }}
          >
            {act.category}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: '1.5' }}>
          {act.desc}
        </p>
        {act.tips && (
          <div
            style={{
              fontSize: '12px',
              color: '#f59e0b',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.15)',
              display: 'inline-block',
              marginBottom: '6px',
            }}
          >
            💡 {act.tips}
          </div>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: '#4f8ef7',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          在地图中查看
        </a>
      </div>
    </div>
  )
}

function InlineSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
