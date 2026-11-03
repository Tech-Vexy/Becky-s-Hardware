/**
 * Tag UI primitives for Becky's Hardware Store product tagging.
 *
 * Exports:
 *   TagPill     — read-only coloured tag chip
 *   TagInput    — full tag manager: search existing, create new, remove tags
 *   TAG_PRESETS — curated list of store-appropriate preset tags
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import type { ProductTag } from '@/lib/types/database';

// ─── Preset colours ──────────────────────────────────────────────────────────

export const TAG_COLORS = [
  { id: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-800',   ring: 'ring-blue-400'   },
  { id: 'amber',  bg: 'bg-amber-100',  text: 'text-amber-800',  ring: 'ring-amber-400'  },
  { id: 'emerald',bg: 'bg-emerald-100',text: 'text-emerald-800',ring: 'ring-emerald-400'},
  { id: 'rose',   bg: 'bg-rose-100',   text: 'text-rose-800',   ring: 'ring-rose-400'   },
  { id: 'violet', bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-400' },
  { id: 'sky',    bg: 'bg-sky-100',    text: 'text-sky-800',    ring: 'ring-sky-400'    },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-400' },
  { id: 'slate',  bg: 'bg-slate-100',  text: 'text-slate-700',  ring: 'ring-slate-300'  },
] as const;

export type TagColorId = typeof TAG_COLORS[number]['id'];

/** Return Tailwind classes for a stored color string like "amber" */
export function resolveTagColor(color: string): { bg: string; text: string; ring: string } {
  return (
    TAG_COLORS.find((c) => c.id === color) ?? TAG_COLORS[TAG_COLORS.length - 1]
  );
}

// ─── Preset tags for hardware stores ─────────────────────────────────────────

export const TAG_PRESETS: Omit<ProductTag, 'created_at'>[] = [
  { id: 'promotion',    label: 'On Promotion',   color: 'rose'    },
  { id: 'new-arrival',  label: 'New Arrival',     color: 'emerald' },
  { id: 'best-seller',  label: 'Best Seller',     color: 'amber'   },
  { id: 'clearance',    label: 'Clearance',       color: 'orange'  },
  { id: 'imported',     label: 'Imported',        color: 'blue'    },
  { id: 'local-brand',  label: 'Local Brand',     color: 'sky'     },
  { id: 'bulk-only',    label: 'Bulk Only',       color: 'violet'  },
  { id: 'fragile',      label: 'Fragile',         color: 'rose'    },
  { id: 'heavy-item',   label: 'Heavy Item',      color: 'slate'   },
  { id: 'electrical',   label: 'Electrical',      color: 'amber'   },
  { id: 'plumbing',     label: 'Plumbing',        color: 'sky'     },
  { id: 'structural',   label: 'Structural',      color: 'slate'   },
];

// ─── TagPill — read-only chip ─────────────────────────────────────────────────

interface TagPillProps {
  tag: ProductTag;
  /** If provided, renders an × button and calls this on click */
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({
  tag,
  onRemove,
  size = 'sm',
  className,
}) => {
  const { bg, text } = resolveTagColor(tag.color);

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-full font-semibold leading-none',
          bg,
          text,
          size === 'sm'  && 'px-2 py-0.5 text-[10px]',
          size === 'md'  && 'px-2.5 py-1 text-xs',
          className
        )
      )}
    >
      {tag.label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 -mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
          aria-label={`Remove tag ${tag.label}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
};

// ─── TagInput — full tag manager ──────────────────────────────────────────────

interface TagInputProps {
  /** IDs of currently selected tags */
  selectedTagIds: string[];
  /** All available tags in the store */
  allTags: ProductTag[];
  /** Called when the selected set changes */
  onChange: (tagIds: string[]) => void;
  /** Called when the user creates a brand-new tag */
  onCreateTag: (tag: Omit<ProductTag, 'created_at'>) => Promise<void>;
  /** Max tags selectable on one product */
  maxTags?: number;
  /** Optional placeholder text */
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  selectedTagIds,
  allTags,
  onChange,
  onCreateTag,
  maxTags = 8,
  placeholder = 'Add tags…',
}) => {
  const [query, setQuery]           = useState('');
  const [isOpen, setIsOpen]         = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel]     = useState('');
  const [newColor, setNewColor]     = useState<TagColorId>('blue');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));

  const filteredOptions = allTags.filter(
    (t) =>
      !selectedTagIds.includes(t.id) &&
      t.label.toLowerCase().includes(query.toLowerCase())
  );

  const canAddMore = selectedTagIds.length < maxTags;

  const handleSelect = (tag: ProductTag) => {
    if (!canAddMore) return;
    onChange([...selectedTagIds, tag.id]);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateSubmit = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await onCreateTag({ id, label, color: newColor });
    onChange([...selectedTagIds, id]);
    setNewLabel('');
    setNewColor('blue');
    setIsCreating(false);
    setQuery('');
  };

  const queryMatchesExisting = allTags.some(
    (t) => t.label.toLowerCase() === query.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips + input row */}
      <div
        className={clsx(
          'flex flex-wrap items-center gap-1.5 min-h-[38px] rounded-xl border bg-white px-3 py-2 cursor-text transition-all',
          isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
        )}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedTags.map((tag) => (
          <TagPill key={tag.id} tag={tag} onRemove={() => handleRemove(tag.id)} size="sm" />
        ))}

        {canAddMore && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            aria-label="Tag search"
          />
        )}

        {!canAddMore && (
          <span className="text-[10px] text-slate-400 ml-1">Max {maxTags} tags</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-scale-in">
          {/* Options list */}
          {!isCreating && (
            <div className="max-h-52 overflow-y-auto">
              {/* Preset quick-picks (when no query) */}
              {query === '' && (
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Suggested
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_PRESETS
                      .filter((p) => !selectedTagIds.includes(p.id))
                      .slice(0, 6)
                      .map((preset) => {
                        const existing = allTags.find((t) => t.id === preset.id);
                        const tag = existing ?? { ...preset, created_at: new Date().toISOString() };
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={async () => {
                              if (!existing) await onCreateTag(preset);
                              handleSelect(tag);
                            }}
                            disabled={!canAddMore}
                          >
                            <TagPill tag={tag} size="sm" className="cursor-pointer hover:opacity-80 transition-opacity" />
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {filteredOptions.length > 0 && (
                <div className="px-1 py-1">
                  {query !== '' && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 pt-1 pb-1">
                      Existing tags
                    </p>
                  )}
                  {filteredOptions.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelect(tag)}
                      disabled={!canAddMore}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <TagPill tag={tag} size="sm" />
                      {selectedTagIds.includes(tag.id) && (
                        <Check className="h-3 w-3 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {filteredOptions.length === 0 && query !== '' && !queryMatchesExisting && (
                <div className="px-3 py-2 text-xs text-slate-400">No matching tags.</div>
              )}
            </div>
          )}

          {/* Create new tag form */}
          {isCreating ? (
            <div className="p-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700">Create new tag</p>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubmit(); } }}
                placeholder="Tag name, e.g. On Promotion"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewColor(c.id as TagColorId)}
                    className={clsx(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      c.bg,
                      newColor === c.id ? 'border-slate-700 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    aria-label={`Select ${c.id} colour`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewLabel(''); }}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={!newLabel.trim()}
                  className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Create Tag
                </button>
              </div>
            </div>
          ) : (
            // Footer: create new option
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  if (query) setNewLabel(query);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {query ? `Create "${query}"` : 'Create new tag'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
