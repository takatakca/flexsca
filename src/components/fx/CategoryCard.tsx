import { Link } from "react-router-dom";
import { servicePhoto } from "@/lib/service-photo";

export interface CategoryCardData { id: string; name: string; slug: string; icon: string | null; hero_image: string | null }

/** Service card used on the homepage, the customer dashboard and category lists: photo on top, name underneath. */
export default function CategoryCard({ category, badge }: { category: CategoryCardData; badge?: string }) {
  return (
    <Link to={`/services/${category.slug}`} className="group block overflow-hidden rounded-fx-xs border border-fx-line bg-card">
      <div className="relative aspect-[380/232] bg-fx-sunken">
        {category.hero_image
          ? <img src={servicePhoto(category.hero_image)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-5xl">{category.icon ?? "🛠️"}</span>}
        {badge && <span className="absolute right-2.5 top-2.5 rounded-fx-pill bg-primary px-3 py-1.5 text-[11px] text-primary-foreground">{badge}</span>}
      </div>
      <p className="px-[18px] py-4 text-lg text-fx-ink">{category.name}</p>
    </Link>
  );
}

/** Section heading. Centred on phones; on desktop it sits left with an optional action on the right (frame 2:2). */
export function SectionTitle({ children, id, action, center }: { children: React.ReactNode; id?: string; action?: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "text-center" : "text-center md:flex md:items-end md:justify-between md:text-left"}>
      <h2 id={id} className="text-[28px] leading-tight text-fx-ink">{children}</h2>
      {action && <div className="hidden md:block">{action}</div>}
    </div>
  );
}
