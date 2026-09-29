'use client'

import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { authClient } from '@/lib/auth-client'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  Network,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

type Event = {
  id: string
  title: string
  source: string
  time: string
  severity: Severity
  ip: string
  status: 'Investigating' | 'Blocked' | 'Monitoring' | 'Resolved'
}

const events: Event[] = [
  { id: 'EVT-90231', title: 'Multiple failed SSH login attempts', source: 'prod-api-01', time: '2 min ago', severity: 'Critical', ip: '185.220.101.14', status: 'Investigating' },
  { id: 'EVT-90228', title: 'Unusual outbound data transfer', source: 'db-cluster-east', time: '8 min ago', severity: 'High', ip: '10.24.8.19', status: 'Blocked' },
  { id: 'EVT-90224', title: 'Privilege escalation detected', source: 'workstation-44', time: '14 min ago', severity: 'High', ip: '10.24.17.44', status: 'Investigating' },
  { id: 'EVT-90219', title: 'New admin account created', source: 'identity-service', time: '26 min ago', severity: 'Medium', ip: '10.24.2.8', status: 'Monitoring' },
  { id: 'EVT-90214', title: 'Endpoint malware signature match', source: 'sales-laptop-08', time: '41 min ago', severity: 'Medium', ip: '10.24.31.8', status: 'Resolved' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Event explorer', icon: Activity, count: '1.2k' },
  { label: 'Alerts', icon: Bell, count: '12' },
  { label: 'Assets', icon: Server },
  { label: 'Reports', icon: FileText },
]

const severityStyles: Record<Severity, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Medium: 'severity-medium',
  Low: 'severity-low',
}

function Sparkline({ color = '#76e6b1', bars = false }: { color?: string; bars?: boolean }) {
  return (
    <div className={bars ? 'mini-bars' : 'sparkline'} aria-hidden="true">
      {Array.from({ length: bars ? 12 : 20 }).map((_, index) => (
        <i key={index} style={{ height: `${bars ? 28 + ((index * 17) % 54) : 25 + ((index * 29) % 62)}%`, backgroundColor: color }} />
      ))}
    </div>
  )
}

function MetricCard({ label, value, detail, trend, icon: Icon, tone = 'green' }: { label: string; value: string; detail: string; trend: string; icon: typeof Activity; tone?: string }) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}><Icon size={15} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-footline"><span>{detail}</span><span className="trend"><ArrowUpRight size={13} /> {trend}</span></div>
    </article>
  )
}

function DonutChart() {
  return (
    <div className="donut-wrap">
      <div className="donut"><div><strong>2,847</strong><span>events today</span></div></div>
      <div className="legend-list">
        <div><span className="legend-dot critical" />Critical <b>08</b></div>
        <div><span className="legend-dot high" />High <b>142</b></div>
        <div><span className="legend-dot medium" />Medium <b>738</b></div>
        <div><span className="legend-dot low" />Low <b>1,959</b></div>
      </div>
    </div>
  )
}

export default function SiemDashboard({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Analyst'
  const displayEmail = user?.email || 'Authenticated workspace'
  const [activeNav, setActiveNav] = useState('Overview')
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<'All severities' | Severity>('All severities')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(12)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [dateRange, setDateRange] = useState('Last 24 hours')
  const [scanRunning, setScanRunning] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [toast, setToast] = useState('')
  const [managePanel, setManagePanel] = useState<'Integrations' | 'Settings' | null>(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [activeAsset, setActiveAsset] = useState<string | null>(null)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [assetDiscoveryRunning, setAssetDiscoveryRunning] = useState(false)
  const [discoveredAssets, setDiscoveredAssets] = useState([
    { name: 'prod-api-01', type: 'Linux server', status: 'Healthy', detail: 'Last seen 2 min ago' },
    { name: 'db-cluster-east', type: 'Database cluster', status: 'Monitoring', detail: 'Last seen 8 min ago' },
    { name: 'sales-laptop-08', type: 'Endpoint', status: 'Needs review', detail: 'Last seen 41 min ago' },
  ])
  const [reportGenerating, setReportGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState<'weekly' | 'compliance' | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const runScan = () => {
    if (scanRunning) return
    setScanRunning(true)
    showToast('Scan started across 24 connected sources')
    window.setTimeout(() => {
      setScanRunning(false)
      showToast('Scan complete — no new critical threats found')
    }, 2200)
  }

  const downloadReport = () => {
    if (!selectedReport) return
    const isWeekly = selectedReport === 'weekly'
    const title = isWeekly ? 'Weekly Security Summary' : 'Compliance Activity Export'
    const period = isWeekly ? 'September 23 – 29, 2026' : 'September 2026'
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 48
    const green = [28, 178, 123] as const
    const navy = [17, 28, 48] as const
    const slate = [82, 98, 119] as const
    let y = 54

    const addFooter = () => {
      doc.setDrawColor(224, 230, 237)
      doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...slate)
      doc.text('SentinelOS  |  Confidential security operations report', margin, pageHeight - 26)
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 26, { align: 'right' })
    }

    const section = (heading: string) => {
      y += 18
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...green)
      doc.text(heading, margin, y)
      y += 18
    }

    doc.setFillColor(...navy)
    doc.rect(0, 0, pageWidth, 118, 'F')
    doc.setFillColor(...green)
    doc.rect(margin, 34, 7, 47, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('SentinelOS', margin + 20, 54)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(181, 203, 220)
    doc.text('SECURITY OPERATIONS  /  NORTHSTAR', margin + 20, 72)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...navy)
    doc.text(title, margin, 158)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...slate)
    doc.text(`Workspace: Northstar / prod    |    Reporting period: ${period}`, margin, 178)
    doc.text('Generated September 29, 2026 by SentinelOS Security Operations', margin, 194)
    y = 230

    section('EXECUTIVE SUMMARY')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...navy)
    const summary = isWeekly
      ? 'Security activity remained within the expected baseline. Automated controls blocked 284 threats while the monitoring team investigated 12 active alerts.'
      : 'This report records security activity and control outcomes for the selected period. No unresolved critical compliance exceptions were found.'
    doc.text(doc.splitTextToSize(summary, pageWidth - margin * 2), margin, y, { maxWidth: pageWidth - margin * 2, lineHeightFactor: 1.5 })
    y += 48

    section('SECURITY SNAPSHOT')
    const cards = [
      ['12,482', 'Events reviewed'],
      ['284', 'Threats blocked'],
      ['12', 'Active alerts'],
      ['31 / 100', 'Current risk score'],
    ]
    const cardWidth = (pageWidth - margin * 2 - 24) / 4
    cards.forEach(([value, label], index) => {
      const x = margin + index * (cardWidth + 8)
      doc.setFillColor(244, 248, 250)
      doc.roundedRect(x, y, cardWidth, 58, 5, 5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(...navy)
      doc.text(value, x + 10, y + 24)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...slate)
      doc.text(label, x + 10, y + 42)
    })
    y += 86

    section('KEY FINDINGS')
    const findings = ['94.6% of events remained within the normal baseline.', '4 high-severity events require continued investigation.', 'All 24 connected sources reported normally during the period.']
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...navy)
    findings.forEach((finding) => { doc.setFillColor(...green); doc.circle(margin + 4, y - 3, 2.5, 'F'); doc.text(finding, margin + 16, y); y += 22 })

    section('RECENT SECURITY EVENTS')
    doc.setFillColor(...navy)
    doc.rect(margin, y - 12, pageWidth - margin * 2, 24, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('EVENT', margin + 10, y + 3)
    doc.text('SOURCE', margin + 250, y + 3)
    doc.text('SEVERITY', margin + 385, y + 3)
    doc.text('STATUS', margin + 445, y + 3)
    y += 28
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...navy)
    events.slice(0, 5).forEach((event, index) => { if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 13, pageWidth - margin * 2, 23, 'F') }; doc.text(event.title.slice(0, 38), margin + 10, y); doc.text(event.source, margin + 250, y); doc.text(event.severity, margin + 385, y); doc.text(event.status, margin + 445, y); y += 23 })
    addFooter()
    doc.save(`${isWeekly ? 'weekly-security-summary' : 'compliance-activity-export'}-2026-09-29.pdf`)
    showToast('PDF report downloaded successfully')
  }

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesQuery = `${event.title} ${event.source} ${event.ip}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (severity === 'All severities' || event.severity === severity)
  }), [query, severity])

  const selectMonitorView = (label: string) => {
    setActiveNav(label)
    setManagePanel(null)
    setMenuOpen(false)
    if (label === 'Event explorer' || label === 'Alerts') {
      setShowAllEvents(true)
      window.setTimeout(() => document.getElementById('security-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
    if (label === 'Assets' || label === 'Reports') {
      window.setTimeout(() => document.getElementById(`${label.toLowerCase()}-workspace`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
    showToast(`${label} view selected`)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><ShieldCheck size={19} /></div><div><strong>Sentinel<span>OS</span></strong><small>security operations</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <button className={`workspace-switcher ${workspaceOpen ? 'active' : ''}`} onClick={() => setWorkspaceOpen((open) => !open)} aria-expanded={workspaceOpen}><span className="workspace-dot" /><div><small>WORKSPACE</small><strong>Northstar / prod</strong></div><ChevronDown size={15} /></button>{workspaceOpen && <div className="workspace-menu" role="menu"><button onClick={() => { setWorkspaceOpen(false); showToast('Northstar / prod workspace selected') }}><span className="workspace-dot" />Northstar / prod <b>Active</b></button><button onClick={() => { setWorkspaceOpen(false); showToast('Staging workspace is not connected') }}><span className="workspace-dot muted" />Northstar / staging <small>Connect</small></button><button onClick={() => { setWorkspaceOpen(false); showToast('Workspace creation opened') }}>+ Create workspace</button></div>}
        <nav aria-label="Main navigation">
          <p className="nav-label">Monitor</p>
          {navItems.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => label === 'Overview' ? (setActiveNav('Overview'), setManagePanel(null), setMenuOpen(false)) : selectMonitorView(label)}><Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}</button>)}
          <p className="nav-label">Manage</p>
          <button className={`nav-item ${activeNav === 'Integrations' ? 'active' : ''}`} onClick={() => { setActiveNav('Integrations'); setManagePanel('Integrations'); setMenuOpen(false) }}><Network size={17} /><span>Integrations</span></button>
          <button className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`} onClick={() => { setActiveNav('Settings'); setManagePanel('Settings'); setMenuOpen(false) }}><Settings2 size={17} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-footer"><div className="system-status"><span className="live-pulse" />All systems operational</div><div className="user-row"><div className="avatar">{displayName.slice(0, 2).toUpperCase()}</div><div><strong>{displayName}</strong><span>{displayEmail}</span></div><button className="user-menu-button" onClick={() => setProfileOpen((open) => !open)} aria-label="Open account menu"><MoreHorizontal size={17} /></button></div>{profileOpen && <div className="account-menu"><button onClick={async () => { await authClient.signOut(); window.location.href = '/sign-in' }}><LogOut size={15} /> Sign out</button></div>}</div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Monitor</span><b>/</b><strong>{activeNav}</strong></div><div className="top-actions"><div className="command-search"><Search size={16} /><input aria-label="Search dashboard" placeholder="Search events, assets..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div><div className="notification-wrap"><button className={`icon-btn notification-btn ${notificationOpen ? 'active' : ''}`} onClick={() => setNotificationOpen((open) => !open)} aria-label={`${notifications} unread notifications`} aria-expanded={notificationOpen}><Bell size={18} />{notifications > 0 && <i>{notifications}</i>}</button>{notificationOpen && <div className="notification-panel" role="dialog" aria-label="Notifications"><div className="notification-heading"><div><strong>Notifications</strong><small>{notifications ? `${notifications} unread updates` : 'You are all caught up'}</small></div><button onClick={() => { setNotifications(0); showToast('All notifications marked as read') }} disabled={!notifications}>Mark all read</button></div><div className="notification-list"><button onClick={() => { setNotificationOpen(false); setSelectedEvent(events[0]) }}><span className="notification-dot critical" /><span><strong>Critical event needs attention</strong><small>Multiple failed SSH login attempts · 2 min ago</small></span><b>›</b></button><button onClick={() => { setNotificationOpen(false); setActiveNav('Alerts'); showToast('Alerts view selected') }}><span className="notification-dot amber" /><span><strong>Alert queue updated</strong><small>12 active alerts are awaiting review</small></span><b>›</b></button><button onClick={() => { setNotificationOpen(false); setActiveNav('Integrations'); setManagePanel('Integrations') }}><span className="notification-dot green" /><span><strong>Event stream healthy</strong><small>All 24 connected sources are reporting</small></span><b>›</b></button></div></div>}</div><button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}><span className="avatar small">{displayName.slice(0, 2).toUpperCase()}</span><ChevronDown size={14} /></button></div></header>

        <div className="content-wrap">
          {activeNav === 'Assets' && <section className="panel workspace-view" id="assets-workspace"><div className="panel-heading"><div><p className="eyebrow">INVENTORY</p><h2>Assets</h2><p>Monitor connected infrastructure and endpoint health.</p></div><button className="primary-btn" disabled={assetDiscoveryRunning} onClick={() => { setAssetDiscoveryRunning(true); showToast('Asset discovery started'); window.setTimeout(() => { setDiscoveredAssets((current) => current.some((asset) => asset.name === 'edge-gateway-02') ? current : [...current, { name: 'edge-gateway-02', type: 'Network gateway', status: 'Healthy', detail: 'Discovered just now' }]); setAssetDiscoveryRunning(false); showToast('Asset discovery complete — 1 new asset found') }, 1800) }}><Search size={15} /> {assetDiscoveryRunning ? 'Discovering...' : 'Discover assets'}</button></div><div className="asset-grid">{discoveredAssets.map((asset) => <button key={asset.name} className={`asset-card ${activeAsset === asset.name ? 'selected' : ''}`} onClick={() => { setActiveAsset(asset.name); showToast(`${asset.name} selected`) }}><span className="asset-icon"><Server size={17} /></span><span><strong>{asset.name}</strong><small>{asset.type}</small><small>{asset.detail}</small></span><em className={asset.status === 'Needs review' ? 'asset-warning' : ''}>{asset.status}</em></button>)}</div>{activeAsset && <div className="report-success" role="status">Selected asset: {activeAsset}. Monitoring actions are ready.</div>}</section>}
          {activeNav === 'Reports' && <section className="panel workspace-view" id="reports-workspace"><div className="panel-heading"><div><p className="eyebrow">ANALYTICS</p><h2>Reports</h2><p>Generate and review security reports for your workspace.</p></div><button className="primary-btn" disabled={reportGenerating} onClick={() => { setReportGenerating(true); showToast('Building security report...'); window.setTimeout(() => { setReportGenerated(true); setReportGenerating(false); showToast('Security report generated') }, 1600) }}><FileText size={15} /> {reportGenerating ? 'Generating...' : reportGenerated ? 'Regenerate report' : 'Generate report'}</button></div><div className="report-list"><button onClick={() => setSelectedReport('weekly')}><FileText size={17} /><span><strong>Weekly security summary</strong><small>Generated today · PDF · 24 connected sources</small></span><b>View report</b></button><button onClick={() => setSelectedReport('compliance')}><FileText size={17} /><span><strong>Compliance activity export</strong><small>Generated yesterday · CSV · 2,847 events</small></span><b>View report</b></button>{reportGenerated && <div className="report-success" role="status">New report is ready to review and download.</div>}</div></section>}
          {managePanel && <section className="manage-panel panel" aria-labelledby="manage-title"><div className="panel-heading"><div><p className="eyebrow">MANAGE</p><h2 id="manage-title">{managePanel}</h2><p>{managePanel === 'Integrations' ? 'Connected services and ingestion health.' : 'Workspace preferences and security controls.'}</p></div><button className="icon-btn" onClick={() => setManagePanel(null)} aria-label={`Close ${managePanel}`}><X size={18} /></button></div>{managePanel === 'Integrations' ? <div className="manage-list"><div><span className="integration-logo">N</span><div><strong>Neon Postgres</strong><small>Identity, sessions, and security data</small></div><span className="connected-badge">Connected</span></div><div><span className="integration-logo green">S</span><div><strong>Sentinel event stream</strong><small>24 sources reporting normally</small></div><span className="connected-badge">Healthy</span></div></div> : <div className="settings-list"><label><span><strong>Realtime notifications</strong><small>Show toast updates for scans and events</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Automatic threat triage</strong><small>Prioritize critical events automatically</small></span><input type="checkbox" defaultChecked /></label></div>}</section>}
          <div className="page-heading"><div><p className="eyebrow">TUESDAY, SEPTEMBER 29, 2026 <span className="live-pill"><span className="live-pulse" />LIVE</span></p><h1>Security overview</h1><p className="subheading">Your environment is being monitored across 24 connected sources.</p></div><div className="heading-actions"><select className="outline-btn" aria-label="Select time range" value={dateRange} onChange={(event) => { setDateRange(event.target.value); showToast(`Showing ${event.target.value.toLowerCase()}`) }}><option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select><button className="primary-btn" onClick={runScan} disabled={scanRunning}><Zap size={15} /> {scanRunning ? 'Scanning...' : 'Run scan'}</button></div></div>

          <section className="metric-grid" aria-label="Security metrics"><MetricCard label="Total events" value="12,482" detail="vs. previous period" trend="8.4%" icon={Activity} /><MetricCard label="Active alerts" value="12" detail="4 require attention" trend="2.1%" icon={Bell} tone="amber" /><MetricCard label="Blocked threats" value="284" detail="this reporting period" trend="16.8%" icon={LockKeyhole} /><MetricCard label="Risk score" value="31 / 100" detail="down from 38" trend="18.2%" icon={ShieldCheck} tone="blue" /></section>

          <section className="dashboard-grid"><article className="panel event-volume"><div className="panel-heading"><div><h2>Event volume</h2><p>Incoming security events by hour</p></div><button className="select-button">Last 24 hours <ChevronDown size={14} /></button></div><div className="chart-area"><div className="y-axis"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 760 230" preserveAspectRatio="none" role="img" aria-label="Event volume trend chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#76e6b1" stopOpacity=".28" /><stop offset="1" stopColor="#76e6b1" stopOpacity="0" /></linearGradient></defs><path d="M0 194 C35 182 52 158 81 168 S130 198 161 154 S208 93 241 122 S278 177 310 140 S360 76 394 118 S437 165 470 112 S507 75 540 96 S575 136 603 94 S649 52 684 83 S722 130 760 49 L760 230 L0 230Z" fill="url(#area)" /><path d="M0 194 C35 182 52 158 81 168 S130 198 161 154 S208 93 241 122 S278 177 310 140 S360 76 394 118 S437 165 470 112 S507 75 540 96 S575 136 603 94 S649 52 684 83 S722 130 760 49" fill="none" stroke="#76e6b1" strokeWidth="3" strokeLinecap="round" /></svg><div className="x-axis"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span></div></div></div></article><article className="panel severity-panel"><div className="panel-heading"><div><h2>Events by severity</h2><p>Classification across all sources</p></div><button className="more-button" aria-label="More options"><MoreHorizontal size={18} /></button></div><DonutChart /><div className="severity-summary"><span><b className="dot-green" /> 94.6%</span><span>within baseline</span></div></article></section>

          <section className={`panel events-panel ${showAllEvents ? 'events-expanded' : ''}`} id="security-events"><div className="panel-heading events-header"><div><h2>{showAllEvents ? 'All security events' : 'Recent security events'}</h2><p>Prioritized activity from your environment</p></div><div className="events-actions"><button className="view-all-button" onClick={() => { setShowAllEvents((open) => !open); showToast(showAllEvents ? 'Showing recent events' : 'Showing all security events') }}>{showAllEvents ? 'Show recent' : 'View all events'}</button><div className="filter-search"><Search size={15} /><input aria-label="Filter events" placeholder="Filter events" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filter by severity" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}><option>All severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><button className={`filter-btn ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><SlidersHorizontal size={15} /> Filters</button>{filtersOpen && <div className="filter-popover"><strong>Quick filters</strong><button onClick={() => { setSeverity('Critical'); setFiltersOpen(false); showToast('Showing critical events only') }}>Critical events</button><button onClick={() => { setSeverity('High'); setFiltersOpen(false); showToast('Showing high severity events') }}>High severity</button><button onClick={() => { setSeverity('All severities'); setFiltersOpen(false); showToast('All severities restored') }}>Clear filters</button></div>}</div></div><div className="table-wrap"><table><thead><tr><th>Event</th><th>Source</th><th>Detected</th><th>Severity</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredEvents.map((event) => <tr key={event.id}><td><div className="event-title"><span className={`event-icon ${severityStyles[event.severity]}`}><AlertTriangle size={14} /></span><div><strong>{event.title}</strong><small>{event.id} · {event.ip}</small></div></div></td><td><span className="source-name">{event.source}</span></td><td>{event.time}</td><td><span className={`severity-tag ${severityStyles[event.severity]}`}><i />{event.severity}</span></td><td><span className={`status-tag status-${event.status.toLowerCase()}`}>{event.status}</span></td><td><button className="row-more" onClick={() => setSelectedEvent(event)} aria-label={`View actions for ${event.id}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{filteredEvents.length === 0 && <div className="empty-state">No events match your filters.</div>}</div><div className="table-footer"><span>Showing {filteredEvents.length} of 12,482 events</span><button className="link-button" onClick={() => setActiveNav('Event explorer')}>View all events <ArrowDownRight size={14} /></button></div></section>
        </div>
      </main>
      {toast && <div className="toast" role="status"><span className="live-pulse" />{toast}</div>}
      {selectedEvent && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedEvent(null)}><section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className={`severity-tag ${severityStyles[selectedEvent.severity]}`}><i />{selectedEvent.severity}</span><h2 id="event-dialog-title">{selectedEvent.title}</h2><p>{selectedEvent.id} · detected {selectedEvent.time}</p></div><button className="icon-btn" onClick={() => setSelectedEvent(null)} aria-label="Close event details"><X size={18} /></button></div><div className="event-detail-grid"><div><small>Source</small><strong>{selectedEvent.source}</strong></div><div><small>IP address</small><strong>{selectedEvent.ip}</strong></div><div><small>Status</small><strong>{selectedEvent.status}</strong></div></div><div className="modal-actions"><button className="outline-btn" onClick={() => { setSelectedEvent(null); showToast('Event marked as resolved') }}>Mark resolved</button><button className="primary-btn" onClick={() => { setSelectedEvent(null); showToast('Investigation opened') }}>Investigate event</button></div></section></div>}
      {selectedReport && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedReport(null)}><section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="report-kicker"><FileText size={13} /> SECURITY REPORT</span><h2 id="report-dialog-title">{selectedReport === 'weekly' ? 'Weekly security summary' : 'Compliance activity export'}</h2><p>Northstar / prod · Generated September 29, 2026</p></div><button className="icon-btn" onClick={() => setSelectedReport(null)} aria-label="Close report"><X size={18} /></button></div><div className="report-meta"><div><small>Reporting period</small><strong>{selectedReport === 'weekly' ? 'Sep 23 – Sep 29, 2026' : 'September 2026'}</strong></div><div><small>Sources analyzed</small><strong>24 connected sources</strong></div><div><small>Events reviewed</small><strong>{selectedReport === 'weekly' ? '12,482' : '2,847'}</strong></div></div><div className="report-body"><h3>Executive summary</h3><p>{selectedReport === 'weekly' ? 'Security activity remained within the expected baseline. Automated controls blocked 284 threats while the monitoring team investigated 12 active alerts.' : 'This export records security activity and control outcomes for the selected period. No unresolved critical compliance exceptions were found.'}</p><h3>Key findings</h3><ul><li><span className="report-status good" />94.6% of events remained within the normal baseline.</li><li><span className="report-status warning" />4 high-severity events require continued investigation.</li><li><span className="report-status good" />All connected sources reported normally during the period.</li></ul></div><div className="modal-actions"><button className="outline-btn" onClick={downloadReport}><Download size={15} /> Download report</button><button className="primary-btn" onClick={() => setSelectedReport(null)}>Done</button></div></section></div>}
    </div>
  )
}

function EmptyState() { return null }

