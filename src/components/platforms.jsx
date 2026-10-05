// Platforms we post to via Buffer; ids match Buffer's service names
const XIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const BlueskyIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" />
    </svg>
);

const InstagramIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.25" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
);

export const PLATFORMS = [
    { id: 'twitter', label: 'X', Icon: XIcon, activeClass: 'bg-black text-white border-gray-400' },
    { id: 'bluesky', label: 'Bluesky', Icon: BlueskyIcon, activeClass: 'bg-[#1185fe] text-white border-[#1185fe]' },
    { id: 'instagram', label: 'Instagram', Icon: InstagramIcon, activeClass: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white border-[#dd2a7b]' },
];

export const platformLabel = (id) => PLATFORMS.find(p => p.id === id)?.label ?? id;

// On/off buttons for choosing which platforms to post to; inactive ones are greyed out
export function PlatformToggles({ selected, onToggle, disabled }) {
    return (
        <div className="flex gap-1.5" role="group" aria-label="Platforms to post to">
            {PLATFORMS.map(({ id, label, Icon, activeClass }) => {
                const on = selected.includes(id);
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onToggle(id)}
                        disabled={disabled}
                        aria-pressed={on}
                        title={`${on ? 'Posting to' : 'Not posting to'} ${label}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition disabled:cursor-not-allowed ${
                            on ? activeClass : 'bg-gray-800 text-gray-500 border-gray-700 opacity-50 hover:opacity-80'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="sr-only">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
