type BadgeStatus = 'interested' | 'following_up' | 'quoted' | 'closed_won' | 'lost';

const statusConfig: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
    interested: { bg: '#F0F0F0', text: '#171717', label: 'Interested' },
    following_up: { bg: '#F0F0F0', text: '#171717', label: 'Following Up' },
    quoted: { bg: '#F0F0F0', text: '#171717', label: 'Quoted' },
    closed_won: { bg: '#171717', text: '#FFFFFF', label: 'Closed Won' },
    lost: { bg: '#FFFFFF', text: '#A3A3A3', label: 'Lost' },
};

export default function StatusBadge({ status }: { status: BadgeStatus }) {
    const config = statusConfig[status];
    return (
        <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium border"
            style={{
                backgroundColor: config.bg,
                color: config.text,
                borderColor: status === 'lost' ? '#E5E5E5' : config.bg,
            }}
        >
            {config.label}
        </span>
    );
}
