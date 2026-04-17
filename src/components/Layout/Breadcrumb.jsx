import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import useInspectionStore from '../../stores/inspectionStore';
import useRackStore from '../../stores/rackStore';

/**
 * Map route segments to human-readable display names.
 * Dynamic segments (IDs) are resolved from stores.
 */
function useBreadcrumbs() {
  const location = useLocation();
  const inspections = useInspectionStore((s) => s.inspections);
  const racks = useRackStore((s) => s.racks);

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [];

  // Always start with Home
  crumbs.push({ label: 'Home', path: '/' });

  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];

    if (seg === 'new-inspection') {
      crumbs.push({ label: 'New Inspection', path: '/new-inspection' });
      i++;
    } else if (seg === 'renewals') {
      crumbs.push({ label: 'Renewals', path: '/renewals' });
      i++;
    } else if (seg === 'editors') {
      crumbs.push({ label: 'Database', path: null });
      i++;
      if (segments[i] === 'beams') {
        crumbs.push({ label: 'Beams', path: '/editors/beams' });
        i++;
      } else if (segments[i] === 'frames') {
        crumbs.push({ label: 'Frames', path: '/editors/frames' });
        i++;
      } else if (segments[i] === 'suppliers') {
        crumbs.push({ label: 'Suppliers', path: '/editors/suppliers' });
        i++;
      }
    } else if (seg === 'inspection') {
      i++; // skip "inspection"
      const inspectionId = segments[i];
      if (inspectionId) {
        const inspection = inspections.find((ins) => ins.id === inspectionId);
        const inspName = inspection?.endCustomer || inspection?.reseller || 'Inspection';
        const basePath = `/inspection/${inspectionId}`;
        crumbs.push({ label: inspName, path: `${basePath}/areas` });
        i++;

        while (i < segments.length) {
          const sub = segments[i];

          if (sub === 'areas') {
            crumbs.push({ label: 'Working Areas', path: `${basePath}/areas` });
            i++;
          } else if (sub === 'area') {
            i++; // skip "area"
            const areaId = segments[i];
            if (areaId) {
              const area = inspection?.workingAreas?.find((a) => a.id === areaId);
              const areaName = area?.name || 'Area';
              const areaBasePath = `${basePath}/area/${areaId}`;
              crumbs.push({ label: areaName, path: `${areaBasePath}/racks` });
              i++;

              if (segments[i] === 'racks') {
                crumbs.push({ label: 'Racks', path: `${areaBasePath}/racks` });
                i++;
              } else if (segments[i] === 'layout') {
                crumbs.push({ label: 'Layout', path: `${areaBasePath}/layout` });
                i++;
              } else if (segments[i] === 'rack') {
                i++; // skip "rack"
                const rackId = segments[i];
                if (rackId) {
                  const rack = racks.find((r) => r.id === rackId);
                  const rackName = rack?.name || 'Rack';
                  crumbs.push({ label: rackName, path: null });
                  i++;

                  if (segments[i] === 'bay') {
                    i++; // skip "bay"
                    const bayId = segments[i];
                    if (bayId) {
                      const bay = rack?.bays?.find((b) => b.id === bayId);
                      const bayName = bay?.name || 'Bay';
                      crumbs.push({
                        label: bayName,
                        path: `${areaBasePath}/rack/${rackId}/bay/${bayId}`,
                      });
                      i++;
                    }
                  } else if (segments[i] === 'frame') {
                    i++; // skip "frame"
                    const frameId = segments[i];
                    if (frameId) {
                      const frame = rack?.frames?.find((f) => f.id === frameId);
                      const frameName = frame?.name || 'Frame';
                      crumbs.push({
                        label: frameName,
                        path: `${areaBasePath}/rack/${rackId}/frame/${frameId}`,
                      });
                      i++;
                    }
                  }
                }
              }
            }
          } else {
            i++;
          }
        }
      }
    } else {
      i++;
    }
  }

  return crumbs;
}

export default function Breadcrumb() {
  const navigate = useNavigate();
  const crumbs = useBreadcrumbs();

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 min-w-0 overflow-hidden">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={`${crumb.label}-${index}`}>
            {index > 0 && (
              <ChevronRight size={12} className="text-[#6B7280] shrink-0" />
            )}
            {isFirst ? (
              <button
                onClick={() => navigate('/')}
                className="text-[#6B7280] hover:text-[#F5F5F4] transition-colors shrink-0"
                title="Home"
              >
                <Home size={14} />
              </button>
            ) : (
              <button
                onClick={() => crumb.path && navigate(crumb.path)}
                disabled={!crumb.path || isLast}
                className={`text-sm truncate max-w-[120px] transition-colors ${
                  isLast
                    ? 'text-[#F5F5F4] font-medium cursor-default'
                    : crumb.path
                    ? 'text-[#6B7280] hover:text-[#F5F5F4] cursor-pointer'
                    : 'text-[#6B7280] cursor-default'
                }`}
                title={crumb.label}
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
