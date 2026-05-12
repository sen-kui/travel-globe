import type { Destination, ItineraryParams } from '../types'
import { REGION_COLORS, TRAVEL_STYLES, ITINERARY_BUDGETS, ITINERARY_DAYS } from '../types'
import { useState } from 'react'

interface CountryCardProps {
  destination: Destination
  onClose: () => void
  onGenerateItinerary: (params: ItineraryParams) => void
  generatingItinerary: boolean
}

export default function CountryCard({
  destination: dest,
  onClose,
  onGenerateItinerary,
  generatingItinerary,
}: CountryCardProps) {
  const [days, setDays] = useState<number>(5)
  const [style, setStyle] = useState<string>(TRAVEL_STYLES[0])
  const [budget, setBudget] = useState<string>(ITINERARY_BUDGETS[0])

  const regionColor = REGION_COLORS[dest.region] || '#4f8ef7'

  return (
    <div
      className="glass slide-in-right flex flex-col"
      style={{
        width: '320px',
        height: '100%',
        borderRadius: '16px',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          background: `linear-gradient(135deg, ${hexToRgba(regionColor, 0.15)}, transparent)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>{dest.flag}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {dest.nameCN}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {dest.nameEN}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Region + Rank */}
        <div className="flex items-center" style={{ gap: '8px', marginTop: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: hexToRgba(regionColor, 0.2),
              color: regionColor,
              border: `1px solid ${hexToRgba(regionColor, 0.3)}`,
            }}
          >
            {dest.region}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            热门排名 #{dest.rank}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Desc */}
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '16px',
            fontStyle: 'italic',
          }}
        >
          {dest.desc}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '16px' }}>
          {dest.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {dest.visa.map((v) => (
            <span key={v} className="tag green">
              {v}
            </span>
          ))}
        </div>

        {/* Top 3 */}
        <div style={{ marginBottom: '16px' }}>
          <SectionTitle>必去打卡</SectionTitle>
          <div className="flex flex-col" style={{ gap: '6px' }}>
            {dest.top3.map((place, i) => (
              <div
                key={place}
                className="flex items-center"
                style={{ gap: '10px' }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: i === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)',
                    color: i === 0 ? '#fcd34d' : 'var(--text-secondary)',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{place}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Costs */}
        <div style={{ marginBottom: '16px' }}>
          <SectionTitle>费用参考</SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <CostCard label="直飞" value={`¥${dest.flightDirect.toLocaleString()}`} sub="起" />
            <CostCard label="中转" value={`¥${dest.flightTransfer.toLocaleString()}`} sub="起" />
            <CostCard label="五星酒店" value={`¥${dest.hotel5star.toLocaleString()}`} sub="/晚" />
            <CostCard label="经济酒店" value={`¥${dest.hotel3star.toLocaleString()}`} sub="/晚" />
            <CostCard label="奢华日费" value={`¥${dest.dailyLuxury.toLocaleString()}`} sub="/天" accent />
            <CostCard label="经济日费" value={`¥${dest.dailyBudget.toLocaleString()}`} sub="/天" />
          </div>
        </div>

        {/* Best season */}
        <div style={{ marginBottom: '16px' }}>
          <SectionTitle>最佳季节</SectionTitle>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {dest.bestSeason.map((s) => (
              <span key={s} className="tag purple">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Currency + Timezone */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <InfoCard icon="💱" label="货币" value={dest.currency} />
          <InfoCard icon="🕐" label="时区" value={dest.timezone} />
        </div>

        {/* Generate Itinerary */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
          }}
        >
          <SectionTitle>生成专属行程</SectionTitle>

          {/* Days selector */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              行程天数
            </label>
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {ITINERARY_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: days === d ? '1px solid rgba(79,142,247,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: days === d ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.04)',
                    color: days === d ? '#93c5fd' : 'var(--text-secondary)',
                  }}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>

          {/* Travel style */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              旅行风格
            </label>
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {TRAVEL_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: style === s ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: style === s ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                    color: style === s ? '#c4b5fd' : 'var(--text-secondary)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Budget level */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              预算档位
            </label>
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {ITINERARY_BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: budget === b ? '1px solid rgba(52,211,153,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: budget === b ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                    color: budget === b ? '#6ee7b7' : 'var(--text-secondary)',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => onGenerateItinerary({ days, style, budget })}
            disabled={generatingItinerary}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: generatingItinerary ? 'not-allowed' : 'pointer',
              border: 'none',
              background: generatingItinerary
                ? 'rgba(79,142,247,0.3)'
                : 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
              color: '#fff',
              transition: 'opacity 0.15s',
              opacity: generatingItinerary ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {generatingItinerary ? (
              <>
                <Spinner />
                AI 规划中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                AI 生成专属行程
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  )
}

function CostCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: accent ? '#34d399' : 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sub}</span>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
