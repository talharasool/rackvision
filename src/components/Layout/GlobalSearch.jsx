import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ClipboardList, MapPin, Box } from 'lucide-react';
import useInspectionStore from '../../stores/inspectionStore';
import useRackStore from '../../stores/rackStore';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const inspections = useInspectionStore((s) => s.inspections);
  const racks = useRackStore((s) => s.racks);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const getResults = useCallback(() => {
    if (!query.trim()) return { inspectionResults: [], areaResults: [], rackResults: [] };

    const q = query.toLowerCase();

    const inspectionResults = inspections
      .filter(
        (ins) =>
          (ins.endCustomer || '').toLowerCase().includes(q) ||
          (ins.reseller || '').toLowerCase().includes(q) ||
          (ins.city || '').toLowerCase().includes(q) ||
          (ins.siteAddress || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((ins) => ({
        id: ins.id,
        label: ins.endCustomer || ins.reseller || 'Unnamed Inspection',
        sublabel: [ins.city, ins.siteAddress].filter(Boolean).join(', ') || ins.status,
        path: `/inspection/${ins.id}/areas`,
        type: 'inspection',
      }));

    // Search working areas across all inspections
    const areaResults = [];
    inspections.forEach((ins) => {
      (ins.workingAreas || []).forEach((area) => {
        if ((area.name || '').toLowerCase().includes(q)) {
          areaResults.push({
            id: area.id,
            label: area.name,
            sublabel: ins.endCustomer || ins.reseller || 'Inspection',
            path: `/inspection/${ins.id}/area/${area.id}/racks`,
            type: 'area',
          });
        }
      });
    });

    const rackResults = racks
      .filter((r) => (r.name || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((r) => {
        // Find which inspection/area this rack belongs to
        let inspectionId = null;
        let areaId = r.areaId;
        for (const ins of inspections) {
          const area = (ins.workingAreas || []).find((a) => a.id === r.areaId);
          if (area) {
            inspectionId = ins.id;
            break;
          }
        }
        return {
          id: r.id,
          label: r.name || 'Unnamed Rack',
          sublabel: r.manufacturer || `${r.numberOfBays} bays`,
          path: inspectionId
            ? `/inspection/${inspectionId}/area/${areaId}/layout`
            : null,
          type: 'rack',
        };
      })
      .filter((r) => r.path);

    return { inspectionResults, areaResults: areaResults.slice(0, 5), rackResults };
  }, [query, inspections, racks]);

  const { inspectionResults, areaResults, rackResults } = getResults();
  const hasResults = inspectionResults.length || areaResults.length || rackResults.length;

  const handleSelect = (result) => {
    if (result.path) {
      navigate(result.path);
      onClose();
    }
  };

  if (!isOpen) return null;

  const iconMap = {
    inspection: ClipboardList,
    area: MapPin,
    rack: Box,
  };

  const renderGroup = (title, results) => {
    if (!results.length) return null;
    return (
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          {title}
        </div>
        {results.map((result) => {
          const Icon = iconMap[result.type] || Box;
          return (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#2A2F38] transition-colors"
            >
              <Icon size={16} className="text-[#6B7280] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-[#F5F5F4] truncate">{result.label}</div>
                {result.sublabel && (
                  <div className="text-xs text-[#6B7280] truncate">{result.sublabel}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#23272E] border border-[#363B44] rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-[#363B44]">
          <Search size={18} className="text-[#6B7280] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inspections, racks, areas..."
            className="flex-1 bg-transparent py-3.5 text-[#F5F5F4] text-base placeholder-[#6B7280] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#363B44] text-[10px] text-[#6B7280]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#F5F5F4] transition-colors sm:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              No results found for "{query}"
            </div>
          )}
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              Start typing to search...
            </div>
          )}
          {renderGroup('Inspections', inspectionResults)}
          {renderGroup('Working Areas', areaResults)}
          {renderGroup('Racks', rackResults)}
        </div>
      </div>
    </div>
  );
}
