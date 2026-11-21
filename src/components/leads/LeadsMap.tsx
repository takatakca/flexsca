import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";

export interface MapLead { id: string; city: string | null }
type Towns = Record<string, [number, number]>;

const slug = (text: string) => text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let townsPromise: Promise<Towns> | null = null;
/** One point per Quebec municipality (from OpenStreetMap boundaries), loaded once and only when the map is opened. */
const loadTowns = () => (townsPromise ??= fetch("/data/qc-towns.json").then(r => (r.ok ? r.json() : {})).catch(() => ({})));

/**
 * Map view of the leads list (frames 909:713 and 909:983). A lead is drawn at the centre of its
 * town, never at an address: the customer's exact location is not known to the professional.
 */
export default function LeadsMap({ leads, selectedId, onSelect, children }: { leads: MapLead[]; selectedId: string | null; onSelect: (id: string) => void; children: React.ReactNode }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [towns, setTowns] = useState<Towns | null>(null);
  const [unplaced, setUnplaced] = useState(0);

  useEffect(() => { let active = true; void loadTowns().then(t => { if (active) setTowns(t); }); return () => { active = false; }; }, []);

  useEffect(() => {
    if (!holder.current || map.current) return;
    const instance = L.map(holder.current, { zoomControl: false, attributionControl: true }).setView([46.8, -71.2], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 14, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    map.current = instance;
    return () => { instance.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current || !towns) return;
    layer.current.clearLayers();
    const groups = new Map<string, { at: [number, number]; ids: string[]; name: string }>();
    let missing = 0;
    for (const lead of leads) {
      const at = lead.city ? towns[slug(lead.city)] : undefined;
      if (!at) { missing++; continue; }
      const key = at.join(",");
      const group = groups.get(key) ?? { at, ids: [], name: lead.city! };
      group.ids.push(lead.id); groups.set(key, group);
    }
    setUnplaced(missing);
    const points: [number, number][] = [];
    for (const group of groups.values()) {
      const active = selectedId !== null && group.ids.includes(selectedId);
      const icon = L.divIcon({ className: "", iconSize: [36, 36], iconAnchor: [18, 18],
        html: `<span style="display:grid;place-items:center;width:36px;height:36px;border-radius:9999px;border:3px solid #fff;box-shadow:0 2px 6px rgba(17,22,55,.35);font:700 14px/1 sans-serif;color:#fff;background:${active ? "#111637" : "#2D7AF1"}">${group.ids.length}</span>` });
      L.marker(group.at, { icon, title: `${group.ids.length} request${group.ids.length === 1 ? "" : "s"} in ${group.name}`, keyboard: true })
        .on("click", () => onSelect(group.ids[0])).addTo(layer.current);
      points.push(group.at);
    }
    if (points.length === 1) map.current.setView(points[0], 10);
    else if (points.length > 1) map.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 11 });
  // Re-centre only when the list or the towns change, not on every selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, towns]);

  useEffect(() => {
    if (!map.current || !towns || !selectedId) return;
    const lead = leads.find(item => item.id === selectedId);
    const at = lead?.city ? towns[slug(lead.city)] : undefined;
    if (at) map.current.panTo(at);
  }, [selectedId, leads, towns]);

  return (
    <div className="relative h-[calc(100dvh-17rem)] min-h-[440px] overflow-hidden bg-[#EFEBE2] md:h-[calc(100dvh-13rem)]">
      <div ref={holder} className="absolute inset-0 z-0" role="application" aria-label="Map of request areas" />
      <button type="button" aria-label="Show all requests on the map" onClick={() => map.current?.setView([46.8, -71.2], 6)}
        className="absolute right-4 top-4 z-[500] grid size-12 place-items-center rounded-full bg-white text-fx-ink shadow-fx-card"><Maximize2 className="size-5" aria-hidden="true" /></button>
      {unplaced > 0 && <p className="absolute left-4 top-4 z-[500] rounded-fx-pill bg-white px-3 py-1.5 text-xs text-fx-secondary shadow-fx-card">{unplaced} without a town on the map</p>}
      <div className="absolute inset-x-0 bottom-3 z-[500] flex snap-x snap-mandatory gap-3 overflow-x-auto px-2.5 pb-2 [scrollbar-width:none]">{children}</div>
    </div>
  );
}
