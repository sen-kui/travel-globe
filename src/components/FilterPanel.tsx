import { useState } from 'react'
import type { FilterState } from '../types'
import {
  TRAVEL_TAGS,
  VISA_OPTIONS,
  DURATION_OPTIONS,
  BUDGET_OPTIONS,
  SEASON_OPTIONS,
} from '../types'

interface FilterPanelProps {
  filterState: FilterState
  onChange: (state: FilterState) => void
  matchCount: number
  totalCount: number
}

export default function FilterPanel({
  filterState,
  onChange,
  matchCount,
  totalCount,
}: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  function toggleTag(tag: string) {
    const tags = filterState.tags.includes(tag)
      ? filterState.tags.filter((t) => t !== tag)
      : [...filterState.tags, tag]
    onChange({ ...filterState, tags })
  }

  function toggleVisa(visa: string) {
    const visas = filterState.visa.includes(visa)
      ? filterState.visa.filter((v) => v !== visa)
      : [...filterState.visa, visa]
    onChange({ ...filterState, visa: visas })
  }

  function toggleSeason(season: string) {
    const seasons = filterState.season.includes(season)
      ? filterState.season.filter((s) => s !== season)
      : [...filterState.season, season]
    onChange({ ...filterState, season: seasons })
  }

  function setDuration(duration: string) {
    onChange({ ...filterState, duration: filterState.duration === duration ? '' : duration })
  }

  function setBudget(budget: string) {
    onChange({ ...filterState, budget: filterState.budget === budget ? '' : budget })
  }

  function clearAll() {
    onChange({ tags: [], visa: [], duration: '', budget: '', season: [] })
  }

  const hasFilters =
    filterState.tags.length > 0 ||
    filterState.visa.length > 0 ||
    filterState.duration !== '' ||
    filterState.budget !== '' ||
    filterState.season.length > 0

  return (
    <div
      className="glass slide-in-left flex flex-col"
      style={{
        width: collapsed ? '48px' : '240px',
        height: '100%',
        transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
        borderRadius: '16px',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', minHeight: '52px' }}
      >
        {!collapsed && (
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            筛选目的地
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginLeft: collapsed ? 'auto' : '0',
          }}
          title={collapsed ? '展开筛选' : '折叠筛选'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {/* Match count */}
          <div
            style={{
              marginBottom: '14px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', color: '#93c5fd' }}>
              找到 <strong>{matchCount}</strong> / {totalCount} 个目的地
            </span>
            {hasFilters && (
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '0',
                }}
              >
                清除
              </button>
            )}
          </div>

          {/* Tags */}
          <FilterSection title="玩法类型">
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {TRAVEL_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  active={filterState.tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Visa */}
          <FilterSection title="签证要求">
            <div className="flex flex-col" style={{ gap: '6px' }}>
              {VISA_OPTIONS.map((v) => (
                <RadioChip
                  key={v}
                  label={v}
                  active={filterState.visa.includes(v)}
                  onClick={() => toggleVisa(v)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Duration */}
          <FilterSection title="行程天数">
            <div className="flex flex-col" style={{ gap: '6px' }}>
              {DURATION_OPTIONS.map((d) => (
                <RadioChip
                  key={d}
                  label={d}
                  active={filterState.duration === d}
                  onClick={() => setDuration(d)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Budget */}
          <FilterSection title="人均预算">
            <div className="flex flex-col" style={{ gap: '6px' }}>
              {BUDGET_OPTIONS.map((b) => (
                <RadioChip
                  key={b}
                  label={b}
                  active={filterState.budget === b}
                  onClick={() => setBudget(b)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Season */}
          <FilterSection title="最佳季节">
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {SEASON_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={filterState.season.includes(s)}
                  onClick={() => toggleSeason(s)}
                />
              ))}
            </div>
          </FilterSection>
        </div>
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
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
        {title}
      </div>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        border: active ? '1px solid rgba(79,142,247,0.6)' : '1px solid rgba(255,255,255,0.1)',
        background: active ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.04)',
        color: active ? '#93c5fd' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function RadioChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
        border: active ? '1px solid rgba(79,142,247,0.5)' : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.03)',
        color: active ? '#93c5fd' : 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: active ? '4px solid #4f8ef7' : '2px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      />
      {label}
    </button>
  )
}
