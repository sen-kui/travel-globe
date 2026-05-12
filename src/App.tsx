import { useState, useMemo, useCallback } from 'react'
import Globe from './components/Globe'
import FilterPanel from './components/FilterPanel'
import CountryCard from './components/CountryCard'
import ItineraryModal from './components/ItineraryModal'
import { useItinerary } from './hooks/useItinerary'
import { destinations } from './data/destinations'
import type { Destination, FilterState, ItineraryParams } from './types'
import { DURATION_DAYS, BUDGET_LIMIT } from './types'

const INITIAL_FILTER: FilterState = {
  tags: [],
  visa: [],
  duration: '',
  budget: '',
  season: [],
}

export default function App() {
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [itineraryParams, setItineraryParams] = useState<ItineraryParams | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { status, itinerary, error, generate, reset } = useItinerary()

  // Apply filters
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      // Tags: must match ALL selected tags
      if (filterState.tags.length > 0) {
        const hasAll = filterState.tags.every((tag) => dest.tags.includes(tag))
        if (!hasAll) return false
      }

      // Visa: must match ANY selected visa
      if (filterState.visa.length > 0) {
        const hasAny = filterState.visa.some((v) => dest.visa.includes(v))
        if (!hasAny) return false
      }

      // Duration: estimate total cost based on rep days and check if matches
      if (filterState.duration !== '') {
        const range = DURATION_DAYS[filterState.duration]
        if (range) {
          const repDays = range.rep
          const budgetLimit = filterState.budget ? BUDGET_LIMIT[filterState.budget] : Infinity
          // Use budget daily cost to estimate if duration makes sense
          // For duration filter alone, we just allow all
          if (filterState.budget) {
            const estimatedCost =
              dest.flightDirect + dest.dailyBudget * repDays + dest.hotel3star * repDays
            if (estimatedCost > budgetLimit) return false
          }
        }
      }

      // Budget (standalone): estimate minimum trip cost for 4 days
      if (filterState.budget !== '' && filterState.duration === '') {
        const budgetLimit = BUDGET_LIMIT[filterState.budget]
        const minCost = dest.flightTransfer + dest.dailyBudget * 4 + dest.hotel3star * 3
        if (minCost > budgetLimit) return false
      }

      // Season
      if (filterState.season.length > 0) {
        const hasAny = filterState.season.some((s) => dest.bestSeason.includes(s))
        if (!hasAny) return false
      }

      return true
    })
  }, [filterState])

  const handleGenerateItinerary = useCallback(
    async (params: ItineraryParams) => {
      if (!selectedDestination) return
      setItineraryParams(params)
      setShowModal(true)
      reset()
      await generate(selectedDestination, params)
    },
    [selectedDestination, generate, reset],
  )

  const handleRetry = useCallback(() => {
    if (!selectedDestination || !itineraryParams) return
    reset()
    generate(selectedDestination, itineraryParams)
  }, [selectedDestination, itineraryParams, generate, reset])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    reset()
  }, [reset])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-deep)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🌍
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                旅行地球
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                AI 驱动的旅行规划
              </div>
            </div>
          </div>
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <div
            className="glass"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            点击地球上的国家开始探索
          </div>
        </div>
      </header>

      {/* Globe — full screen background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Globe
          destinations={destinations}
          filteredDestinations={filteredDestinations}
          filterState={filterState}
          selectedDestination={selectedDestination}
          onSelectDestination={setSelectedDestination}
        />
      </div>

      {/* Side panels overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'stretch',
          padding: '72px 16px 16px',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Filter panel */}
        <div style={{ pointerEvents: 'auto', height: '100%', display: 'flex' }}>
          <FilterPanel
            filterState={filterState}
            onChange={setFilterState}
            matchCount={filteredDestinations.length}
            totalCount={destinations.length}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right: Country card */}
        {selectedDestination && (
          <div style={{ pointerEvents: 'auto', height: '100%', display: 'flex' }}>
            <CountryCard
              destination={selectedDestination}
              onClose={() => setSelectedDestination(null)}
              onGenerateItinerary={handleGenerateItinerary}
              generatingItinerary={status === 'generating'}
            />
          </div>
        )}
      </div>

      {/* Destination list (bottom hint when filter active) */}
      {filteredDestinations.length > 0 && filteredDestinations.length < destinations.length && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5,
            display: 'flex',
            gap: '8px',
            maxWidth: 'calc(100vw - 560px)',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            className="glass"
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#93c5fd', fontWeight: 600 }}>
              {filteredDestinations.length}
            </span>
            个目的地符合条件 · 点击地球国家查看详情
          </div>
        </div>
      )}

      {/* Itinerary modal */}
      {showModal && selectedDestination && (
        <ItineraryModal
          status={status}
          itinerary={itinerary}
          error={error}
          destinationName={selectedDestination.nameCN}
          onClose={handleCloseModal}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
