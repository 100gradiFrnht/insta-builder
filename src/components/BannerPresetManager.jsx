import { useState, useRef, useEffect } from 'react';
import { DEFAULT_BANNER_PRESETS, normalizePresets, groupPresets, makePresetId } from '../utils/bannerPresets';

const inputClass = 'w-full p-2 border border-gray-600 rounded text-xs md:text-sm';
const buttonClass = 'px-3 py-1.5 text-xs md:text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed';

function PresetChip({ preset }) {
    return (
        <div
            className="px-3 py-1.5 rounded text-white font-bold uppercase text-sm truncate"
            style={{ backgroundColor: preset.bgColor, letterSpacing: `${preset.letterSpacing}em`, textAlign: preset.align }}
        >
            {preset.text || ' '}
        </div>
    );
}

// Free-typing hex field; only commits complete #rrggbb values
function HexInput({ value, onCommit }) {
    const [draft, setDraft] = useState(value);
    return (
        <input
            type="text"
            value={draft}
            onChange={(e) => {
                const next = e.target.value.trim();
                setDraft(next);
                const hex = next.startsWith('#') ? next : `#${next}`;
                if (/^#[0-9a-f]{6}$/i.test(hex)) onCommit(hex.toLowerCase());
            }}
            onBlur={() => setDraft(value)}
            className={`${inputClass} font-mono`}
        />
    );
}

const SYNC_LABELS = {
    loading: { text: 'Loading shared presets…', className: 'text-gray-400' },
    synced: { text: 'Saved · shared with everyone', className: 'text-gray-400' },
    saving: { text: 'Saving…', className: 'text-gray-400' },
    conflict: { text: 'Someone else changed the presets at the same time. Showing their version; your last edit wasn’t saved.', className: 'text-amber-300' },
    error: { text: 'Can’t reach the server. Changes are only on this device for now.', className: 'text-red-300' },
};

export default function BannerPresetManager({ presets, onChange, onApply, selectedPresetId, onClose, syncStatus, onRetrySync }) {
    const [editingId, setEditingId] = useState(selectedPresetId);
    const [query, setQuery] = useState('');
    const [message, setMessage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => setMessage(null), 4000);
        return () => clearTimeout(t);
    }, [message]);

    const editing = presets.find(p => p.id === editingId) || null;
    const index = editing ? presets.indexOf(editing) : -1;
    const groupNames = [...new Set(presets.map(p => p.group).filter(Boolean))];

    const q = query.trim().toLowerCase();
    const filtered = q
        ? presets.filter(p => [p.name, p.text, p.group, p.id].some(v => v.toLowerCase().includes(q)))
        : presets;

    const updateEditing = (fields) => {
        onChange(presets.map(p => (p.id === editingId ? { ...p, ...fields } : p)));
    };

    const addPreset = (template) => {
        const base = template
            ? { ...template, name: `${template.name} copy` }
            : { group: '', name: 'New preset', text: 'NEW', letterSpacing: 0, align: 'left', bgColor: '#000f85', match: '' };
        const preset = { ...base, id: makePresetId(base.name, presets), match: template ? '' : base.match };
        const insertAt = template ? index + 1 : presets.length;
        onChange([...presets.slice(0, insertAt), preset, ...presets.slice(insertAt)]);
        setEditingId(preset.id);
        setQuery('');
    };

    const deletePreset = () => {
        if (!editing || editing.id === 'custom') return;
        if (!window.confirm(`Delete preset "${editing.name}" for everyone?`)) return;
        const next = presets.filter(p => p.id !== editing.id);
        onChange(next);
        setEditingId(next[Math.min(index, next.length - 1)]?.id ?? null);
    };

    const move = (delta) => {
        const target = index + delta;
        if (index < 0 || target < 0 || target >= presets.length) return;
        const next = [...presets];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const exportPresets = () => {
        const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'banner-presets.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importPresets = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const next = normalizePresets(JSON.parse(await file.text()));
            if (!window.confirm(`Replace the ${presets.length} shared presets with ${next.length} from "${file.name}" for everyone?`)) return;
            onChange(next);
            setEditingId(next[0]?.id ?? null);
            setMessage({ type: 'ok', text: `Imported ${next.length} presets.` });
        } catch (err) {
            setMessage({ type: 'error', text: `Couldn't import: ${err.message}` });
        }
    };

    const resetPresets = () => {
        if (!window.confirm('Reset the shared presets to the built-in defaults for everyone? All custom changes will be lost.')) return;
        onChange(DEFAULT_BANNER_PRESETS);
        setEditingId(selectedPresetId);
        setMessage({ type: 'ok', text: 'Presets reset to defaults.' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/60 md:p-6" onClick={onClose}>
            <div
                className="bg-gray-800 text-gray-200 w-full md:max-w-4xl md:rounded-lg shadow-2xl flex flex-col max-h-full md:max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Manage banner presets"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h2 className="text-base md:text-lg font-semibold">Banner Presets</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none px-2" aria-label="Close">×</button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* List */}
                    <div className={`${editing ? 'hidden md:flex' : 'flex'} flex-col md:w-72 md:border-r border-gray-700 min-h-0 flex-1 md:flex-none`}>
                        <div className="p-3 flex gap-2 border-b border-gray-700">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search presets…"
                                className={inputClass}
                            />
                            <button onClick={() => addPreset(null)} className="px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap">+ New</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {groupPresets(filtered).map(([group, items]) => (
                                <div key={group || '__ungrouped'} className="mb-2">
                                    {group && <div className="text-[11px] uppercase tracking-wide text-gray-400 px-2 pt-2 pb-1">{group}</div>}
                                    {items.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setEditingId(p.id)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition ${
                                                p.id === editingId ? 'bg-blue-600/30 ring-1 ring-blue-500' : 'hover:bg-gray-700'
                                            }`}
                                        >
                                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.bgColor }} />
                                            <span className="truncate flex-1">{p.name}</span>
                                            {p.id === selectedPresetId && <span className="text-[10px] text-blue-300">in use</span>}
                                        </button>
                                    ))}
                                </div>
                            ))}
                            {filtered.length === 0 && <p className="text-sm text-gray-400 p-3">No presets match “{query}”.</p>}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className={`${editing ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-h-0 overflow-y-auto p-4`}>
                        {editing ? (
                            <div className="space-y-4">
                                <button onClick={() => setEditingId(null)} className="md:hidden text-sm text-blue-300">‹ All presets</button>

                                <PresetChip preset={editing} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-300 mb-1 block">Name (shown in the dropdown)</label>
                                        <input type="text" value={editing.name} onChange={(e) => updateEditing({ name: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-300 mb-1 block">Banner text</label>
                                        <input type="text" value={editing.text} onChange={(e) => updateEditing({ text: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-300 mb-1 block">Group</label>
                                        <input
                                            type="text"
                                            list="banner-preset-groups"
                                            value={editing.group}
                                            onChange={(e) => updateEditing({ group: e.target.value })}
                                            placeholder="None (top of list)"
                                            className={inputClass}
                                        />
                                        <datalist id="banner-preset-groups">
                                            {groupNames.map(g => <option key={g} value={g} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-300 mb-1 block">Auto-select on import when post starts with</label>
                                        <input
                                            type="text"
                                            value={editing.match}
                                            onChange={(e) => updateEditing({ match: e.target.value.trim() })}
                                            placeholder="e.g. 🇸🇪 or 🔴"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-300 mb-1 block">Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={editing.bgColor}
                                                onChange={(e) => updateEditing({ bgColor: e.target.value })}
                                                className="w-12 h-10 border border-gray-600 rounded cursor-pointer flex-shrink-0"
                                            />
                                            <HexInput key={editing.id + editing.bgColor} value={editing.bgColor} onCommit={(bgColor) => updateEditing({ bgColor })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-300 mb-1 block">Letter spacing (%)</label>
                                            <input
                                                type="number"
                                                step="1"
                                                value={Math.round(editing.letterSpacing * 100)}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    updateEditing({ letterSpacing: isNaN(val) ? 0 : val / 100 });
                                                }}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-300 mb-1 block">Alignment</label>
                                            <select value={editing.align} onChange={(e) => updateEditing({ align: e.target.value })} className={inputClass}>
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                                    <button onClick={() => { onApply(editing.id); onClose(); }} className="px-3 py-1.5 text-xs md:text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium">Use this preset</button>
                                    <button onClick={() => addPreset(editing)} className={buttonClass}>Duplicate</button>
                                    <button onClick={() => move(-1)} disabled={index <= 0} className={buttonClass}>↑ Move up</button>
                                    <button onClick={() => move(1)} disabled={index >= presets.length - 1} className={buttonClass}>↓ Move down</button>
                                    <button
                                        onClick={deletePreset}
                                        disabled={editing.id === 'custom'}
                                        title={editing.id === 'custom' ? 'Custom is the fallback preset and can’t be deleted' : undefined}
                                        className="px-3 py-1.5 text-xs md:text-sm rounded bg-red-900/60 hover:bg-red-800 text-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed md:ml-auto"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 m-auto">Select a preset to edit it.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-700">
                    <span className="text-xs text-gray-400 mr-auto">
                        {message ? (
                            <span className={message.type === 'error' ? 'text-red-300' : 'text-green-300'}>{message.text}</span>
                        ) : (
                            <span className={SYNC_LABELS[syncStatus]?.className}>
                                {presets.length} presets · {SYNC_LABELS[syncStatus]?.text}
                                {syncStatus === 'error' && (
                                    <button onClick={onRetrySync} className="ml-2 text-blue-300 hover:text-blue-200 underline">Retry</button>
                                )}
                            </span>
                        )}
                    </span>
                    <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importPresets} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className={buttonClass}>Import</button>
                    <button onClick={exportPresets} className={buttonClass}>Export</button>
                    <button onClick={resetPresets} className={buttonClass}>Reset to defaults</button>
                </div>
            </div>
        </div>
    );
}
