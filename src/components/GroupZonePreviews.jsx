import { getGroupReferenceColor } from './groupReferenceColors';
import './GroupZonePreviews.css';

// All cards share an origin and scale. Expand their common view when a zone
// moves beyond the initial view, so distant zones remain visible in previews.
function previewView(maps) {
  let halfWidth = 6;
  let halfHeight = 4;
  for (const zones of Object.values(maps)) {
    for (const zone of zones) {
      halfWidth = Math.max(halfWidth, Math.abs(zone.x) + zone.width / 2 + 0.5);
      halfHeight = Math.max(halfHeight, Math.abs(zone.y) + zone.height / 2 + 0.5);
    }
  }
  halfWidth = Math.max(halfWidth, halfHeight * 1.5);
  halfHeight = halfWidth / 1.5;
  return { halfWidth: halfWidth * 100, halfHeight: halfHeight * 100 };
}

function PreviewMap({ group, zones, view }) {
  const { halfWidth, halfHeight } = view;
  const gridExtent = 1275;
  const gridLines = Array.from({ length: 52 }, (_, index) => index * 50 - gridExtent);
  return <svg className="group-zone-previews__map" viewBox={`${-halfWidth} ${-halfHeight} ${halfWidth * 2} ${halfHeight * 2}`}
    role="img" aria-label={`${group.id} zone preview`}>
    <g className="group-zone-previews__grid" aria-hidden="true">
      {gridLines.map((position) => <path key={position} d={`M${position} ${-gridExtent}V${gridExtent}M${-gridExtent} ${position}H${gridExtent}`} />)}
    </g>
    <path className="group-zone-previews__axes" d={`M${-gridExtent} 0H${gridExtent}M0 ${-gridExtent}V${gridExtent}`} />
    {zones.map((zone) => <g key={zone.id} data-preview-zone={zone.id}>
      <line className="group-zone-previews__connector" x1="0" y1="0" x2={zone.x * 100} y2={-zone.y * 100} />
      <rect className="group-zone-previews__zone" x={(zone.x - zone.width / 2) * 100} y={-(zone.y + zone.height / 2) * 100}
        width={zone.width * 100} height={zone.height * 100} rx="6" />
      <text className="group-zone-previews__zone-number" x={zone.x * 100} y={-zone.y * 100} dy=".35em">{zone.name.replace(/^Zone\s+/, '')}</text>
    </g>)}
    <g className="group-zone-previews__mic">
      <rect x="-25" y="-25" width="50" height="50" rx="6" />
      <path d="M-12 -9H12M-12 0H12M-12 9H12" />
      <text x="36" y="24">MIC</text>
    </g>
    {!zones.length && <text className="group-zone-previews__empty" x="0" y={-halfHeight / 2} textAnchor="middle">No zones</text>}
  </svg>;
}

export default function GroupZonePreviews({ groups, currentGroupId, maps, active, onSelectGroup }) {
  const otherGroups = groups.filter((group) => group.id !== currentGroupId);
  const view = previewView(maps);
  return <aside className="group-zone-previews" aria-label="Other group previews">
    <header><h3>Other groups</h3><p>Select a preview to edit</p></header>
    <div className="group-zone-previews__list">
      {otherGroups.map((group) => {
        const muted = group.enabled === false || group.pickupMode !== 'Talker Position';
        return <button key={group.id} type="button" className={`group-zone-previews__card${muted ? ' is-muted' : ''}`}
          style={{ '--preview-color': getGroupReferenceColor(group.id) }} disabled={!active}
          aria-label={`Edit ${group.id} ${group.camera} zones${group.enabled === false ? ', group disabled' : ''}`}
          onClick={() => onSelectGroup(group.id)}>
          <span className="group-zone-previews__heading"><span className="group-zone-previews__dot" /><strong>{group.id}</strong><span>{group.camera}</span></span>
          <PreviewMap group={group} zones={maps[group.id] || []} view={view} />
        </button>;
      })}
      {!otherGroups.length && <p className="group-zone-previews__none">No other groups</p>}
    </div>
  </aside>;
}
