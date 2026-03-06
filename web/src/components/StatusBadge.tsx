type BadgeStatus = 'asking_quote' | 'drawing' | 'in_progress' | 'keep_contact' | 'on_hold' | 'ordered' | 'others';

const statusConfig: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
    asking_quote: { bg: '#FEF3C7', text: '#92400E', label: 'Asking Quote' },
    drawing: { bg: '#DBEAFE', text: '#1E40AF', label: 'Drawing' },
    in_progress: { bg: '#D1FAE5', text: '#065F46', label: 'In Progress' },
    keep_contact: { bg: '#F3E8FF', text: '#6B21A8', label: 'Keep Contact' },
    on_hold: { bg: '#FEE2E2', text: '#991B1B', label: 'On Hold' },
    ordered: { bg: '#171717', text: '#FFFFFF', label: 'Ordered' },
    others: { bg: '#F0F0F0', text: '#525252', label: 'Others' },
};

export type { BadgeStatus };

export default function StatusBadge({ status }: { status: BadgeStatus }) {
    const config = statusConfig[status];
    if (!config) return <span className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium border border-[#E5E5E5] bg-white text-neutral-500">{status}</span>;
    return (
        <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium border"
            style={{
                backgroundColor: config.bg,
                color: config.text,
                borderColor: config.bg,
            }}
        >
            {config.label}
        </span>
    );
}
