const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending_review: { label: 'Pending review', bg: '#FCEFD9', fg: '#9A5B0B' },
  draft:          { label: 'Draft',          bg: '#EFEFEE', fg: '#6B6B66' },
  sent:           { label: 'Sent',           bg: '#E6EEF8', fg: '#1B5C9B' },
  viewed:         { label: 'Viewed',         bg: '#E9E6F7', fg: '#4B36A0' },
  approved:       { label: 'Approved',       bg: '#E2F2E8', fg: '#0B6E4F' },
  active:         { label: 'Active',         bg: '#E6EEF8', fg: '#1B5C9B' },
  converted:      { label: 'Converted',      bg: '#EFEFEE', fg: '#6B6B66' },
  unpaid:         { label: 'Unpaid',         bg: '#FCEFD9', fg: '#9A5B0B' },
  partial:        { label: 'Partial',        bg: '#FBEEDD', fg: '#A4541A' },
  paid:           { label: 'Paid',           bg: '#E2F2E8', fg: '#0B6E4F' },
  overdue:        { label: 'Overdue',        bg: '#FBE7E5', fg: '#B23A2E' },
  invoiced:       { label: 'Invoiced',       bg: '#FBE7F1', fg: '#A21D5B' },
  complete:       { label: 'Complete',       bg: '#E2F2E8', fg: '#0B6E4F' },
  void:           { label: 'Void',           bg: '#FBE7E5', fg: '#B23A2E' },
}

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { bg: '#EFEFEE', fg: '#6B6B66', label: status }
}

export default function StatusPill({ status }: { status: string }) {
  const s = getStatusColor(status)
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}
