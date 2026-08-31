import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportsTable from '../ReportsTable'
import GridToolbar from '../GridToolbar'
import { useReportGrid } from '../../../lib/reports/useReportGrid'
import { computeTotals, ReportRow } from '../../../lib/reports/columns'
import { STORAGE_KEYS } from '../../../lib/reports/state'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const makeRow = (date: string, over: Partial<ReportRow> = {}): ReportRow => ({
  date,
  fbResults: { spend: 50, impressions: 1000, clicks: 40, ctr: 4, cpm: 50, cpc: 1.25 },
  visitors: 120,
  registrations: 24,
  totalAttendees: 8,
  liveAttendees: 5,
  replayAttendees: 3,
  pastRegistrationCount: 20,
  pastAttendees: 8,
  sessionRegistered: 24,
  sessionSettled: 20,
  sessionLive: 9,
  sessionMissed: 11,
  sessionUpcoming: 4,
  sessionEngaged: 4,
  sessionSales: 1,
  sessionReplay: 2,
  sessionAttendanceRate: 45,
  sessionEngagedPerRegistered: 20,
  sessionEngagementRateLive: 44.4,
  sessionSalesPerRegistered: 5,
  sessionReplayRate: 10,
  engagedTotal: 4,
  engagedLive: 3,
  engagedReplay: 1,
  salesTotal: 1,
  salesLive: 1,
  salesReplay: 0,
  registrationRate: 20,
  attendanceRate: 33.3,
  realAttendanceRate: 40,
  liveAttendanceRate: 20.8,
  replayAttendanceRate: 12.5,
  engagedPerVisitor: 3.3,
  engagedLivePerVisitor: 2.5,
  engagedReplayPerVisitor: 0.8,
  engagedPerRegistered: 16.7,
  engagedLivePerRegistered: 12.5,
  engagedReplayPerRegistered: 4.2,
  engagementRateLive: 60,
  engagementRateReplay: 33.3,
  engagementRateTotal: 50,
  costPerRegistration: 2.08,
  costPerAttendee: 6.25,
  costPerSale: 50,
  revenue: 297,
  liveRevenue: 297,
  replayRevenue: 0,
  averageOrderValue: 297,
  profit: 247,
  roi: 494,
  ...over,
})

const reports = [makeRow('2026-08-01'), makeRow('2026-08-02', { visitors: 300, registrations: 90 })]

function Harness() {
  const grid = useReportGrid()
  if (!grid.hydrated) return null
  return (
    <div>
      <GridToolbar
        grid={grid}
        loading={false}
        canExport
        lastUpdated={null}
        onRefresh={() => {}}
        onExport={() => {}}
        onOpenColumns={() => {}}
      />
      <ReportsTable
        reports={reports}
        totals={computeTotals(reports)}
        grid={grid}
        engagementMinutes={30}
        loading={false}
        dateRange={{ from: '2026-08-01', to: '2026-08-02' }}
        buildDetailsHref={(metric, params) => `/details?metric=${metric}&${new URLSearchParams(params)}`}
        onOpenColumns={() => {}}
      />
    </div>
  )
}

const headerLabels = () =>
  screen
    .getAllByRole('columnheader')
    .map(th => within(th).queryByRole('button', { name: /^Sort by/ })?.textContent?.trim() ?? '')
    .filter(Boolean)

describe('ReportsTable', () => {
  beforeEach(() => {
    localStorage.clear()
    // jsdom has no layout; Popover positions itself from the anchor rect.
    Element.prototype.getBoundingClientRect = () =>
      ({ top: 10, left: 10, right: 110, bottom: 40, width: 100, height: 30, x: 10, y: 10, toJSON: () => {} }) as DOMRect
  })

  it('renders the Essential view with a totals row and drillable counts', () => {
    render(<Harness />)
    expect(headerLabels()).toEqual([
      'Date',
      'Spend',
      'Clicks',
      'Visitors',
      'Registrations',
      'Registered',
      'Live',
      'Yet to run',
      'Attendance',
      'Sales',
      'Reg. rate',
      'Cost / reg.',
    ])
    expect(screen.getByText('Total')).toBeInTheDocument()
    // Registrations total = 24 + 90, linked to the whole range.
    const totalLink = screen.getByRole('link', { name: '114' })
    expect(totalLink).toHaveAttribute(
      'href',
      '/details?metric=registrations&startDate=2026-08-01&endDate=2026-08-02'
    )
    // Per-day registrations link to that day.
    expect(screen.getByRole('link', { name: '90' })).toHaveAttribute('href', '/details?metric=registrations&date=2026-08-02')
  })

  it('hides a column from its header menu and remembers it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Options for FB Clicks' }))
    await user.click(screen.getByRole('menuitem', { name: 'Hide column' }))
    expect(headerLabels()).not.toContain('Clicks')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.working)!)
    expect(stored.columns).not.toContain('fbClicks')
  })

  it('moves a column with the header menu', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Options for Visitors' }))
    await user.click(screen.getByRole('menuitem', { name: 'Move to start' }))
    expect(headerLabels().slice(0, 3)).toEqual(['Date', 'Visitors', 'Spend'])
  })

  it('adds a column from the + popover', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Add column' }))
    await user.type(screen.getByPlaceholderText('Find a column…'), 'profit')
    await user.click(screen.getByRole('button', { name: /^Profit/ }))
    expect(headerLabels()).toContain('Profit')
  })

  it('sorts by clicking a header, cycling asc → desc → off', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const firstDateCell = () => screen.getAllByRole('row')[1].querySelector('td')!.textContent
    expect(firstDateCell()).toContain('Aug 1')

    const sortVisitors = screen.getByRole('button', { name: 'Sort by Visitors' })
    await user.click(sortVisitors) // asc: 120 first
    expect(firstDateCell()).toContain('Aug 1')
    await user.click(sortVisitors) // desc: 300 first
    expect(firstDateCell()).toContain('Aug 2')
    await user.click(sortVisitors) // off: back to chronological
    expect(firstDateCell()).toContain('Aug 1')
  })

  it('reorders columns by dragging one header onto another', () => {
    render(<Harness />)
    const headers = screen.getAllByRole('columnheader')
    const spend = headers[1]
    const visitors = headers[3]
    const dataTransfer = { effectAllowed: '', dropEffect: '', setData: () => {}, getData: () => 'fbSpend' }

    fireEvent.dragStart(spend, { dataTransfer })
    // Pointer on the right half of "Visitors" → drop after it.
    fireEvent.dragOver(visitors, { dataTransfer, clientX: 100 })
    fireEvent.drop(visitors, { dataTransfer })
    fireEvent.dragEnd(spend)

    expect(headerLabels().slice(0, 4)).toEqual(['Date', 'Clicks', 'Visitors', 'Spend'])
  })

  it('switches views from the toolbar and can save the current columns as a new view', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /View Essential/ }))
    await user.click(screen.getByRole('menuitem', { name: /Facebook Ads/ }))
    expect(headerLabels()).toContain('Impressions')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()

    // Tweak and save as a custom view.
    await user.click(screen.getByRole('button', { name: 'Options for FB CPM' }))
    await user.click(screen.getByRole('menuitem', { name: 'Hide column' }))
    await user.click(screen.getByRole('button', { name: 'Save as…' }))
    await user.type(screen.getByPlaceholderText('e.g. Monday check-in'), 'My FB view')
    await user.click(screen.getByRole('button', { name: 'Save view' }))

    expect(screen.getByRole('button', { name: /View My FB view/ })).toBeInTheDocument()
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedViews)!)
    expect(saved).toHaveLength(1)
    expect(saved[0].name).toBe('My FB view')
    expect(saved[0].columns).not.toContain('fbCpm')
  })

  it('restores the working columns and sort on the next mount', async () => {
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({
        viewId: 'essential',
        columns: ['date', 'profit', 'visitors'],
        sort: { columnId: 'visitors', direction: 'desc' },
        density: 'compact',
      })
    )
    render(<Harness />)
    await act(async () => {})
    expect(headerLabels()).toEqual(['Date', 'Profit', 'Visitors'])
    expect(screen.getAllByRole('row')[1].querySelector('td')!.textContent).toContain('Aug 2')
    expect(screen.getByRole('button', { name: 'Compact rows' })).toHaveAttribute('aria-pressed', 'true')
  })
})
