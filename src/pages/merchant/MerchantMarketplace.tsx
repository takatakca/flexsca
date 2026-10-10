import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { type LucideIcon, Camera, Pencil, Plus, Image, BarChart3, HelpCircle, MapPin, Phone, Globe, Link2, ChevronRight, Clock, Star, CheckCircle, X, Trash2, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MerchantMarketplace() {
  const navigate = useNavigate();
  const {
    profile, categories, amenities, hours, media, ctas, highlights,
    loading, saving,
    saveProfile, addCategory, removeCategory, addAmenity, removeAmenity,
    saveHours, addMedia, removeMedia, addCTA, removeCTA, addHighlight, removeHighlight,
    uploadImage,
  } = useMerchantProfile();

  const [editSection, setEditSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editValue2, setEditValue2] = useState("");
  const [editValue3, setEditValue3] = useState("");
  const [editValue4, setEditValue4] = useState("");
  const [hoursState, setHoursState] = useState<{ day: number; open: string; close: string; closed: boolean }[]>([]);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) await saveProfile({ cover_image_url: url });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) await saveProfile({ logo_url: url });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) await addMedia(url, "photo");
    }
  };

  const openEditHours = () => {
    const existing = DAYS.map((_, i) => {
      const h = hours.find(hr => hr.day_of_week === i);
      return { day: i, open: h?.open_time || "09:00", close: h?.close_time || "17:00", closed: h?.is_closed || false };
    });
    setHoursState(existing);
    setEditSection("hours");
  };

  const handleSaveHours = async () => {
    await saveHours(hoursState.map(h => ({
      day_of_week: h.day,
      open_time: h.closed ? null : h.open,
      close_time: h.closed ? null : h.close,
      is_closed: h.closed,
    })));
    setEditSection(null);
  };

  return (
    <div className="pb-8">
      {/* Hidden file inputs */}
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />

      {/* HEADER — BUSINESS PROFILE BANNER */}
      <div className="relative">
        <div className="h-40 bg-muted overflow-hidden relative">
          {profile.cover_image_url ? (
            <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <button onClick={() => coverRef.current?.click()} className="absolute top-3 right-3 h-8 w-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center">
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 -mt-10 relative z-10">
          <div className="flex items-end gap-3">
            <button onClick={() => logoRef.current?.click()} className="h-20 w-20 rounded-xl border-4 border-background bg-muted overflow-hidden flex-shrink-0 relative group">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </button>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{profile.business_name || "Your Business"}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="text-sm font-medium">{profile.rating}</span>
                    <span className="text-xs text-muted-foreground">({profile.review_count})</span>
                  </div>
                )}
                {profile.primary_category && (
                  <span className="text-xs text-muted-foreground">{profile.primary_category}</span>
                )}
              </div>
              {profile.address && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.address}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="flex gap-3 px-4 mt-4">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => photoRef.current?.click()}>
          <Image className="h-4 w-4" /> Add Photo
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => navigate("/app/dashboard")}>
          <BarChart3 className="h-4 w-4" /> Insights
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => navigate("/help")}>
          <HelpCircle className="h-4 w-4" /> Help
        </Button>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* BUSINESS SUMMARY ALERT */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">It's time to check your summary</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Customers rely on accurate information. Review your details to ensure everything is up to date.
            </p>
            <Button size="sm" onClick={() => setEditSection("summary")}>Check Summary</Button>
            {profile.verified && (
              <div className="flex items-center gap-1.5 mt-3 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Verified by business owner</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CATEGORIES */}
        <SectionCard
          title="Categories"
          onAdd={() => { setEditValue(""); setEditSection("addCategory"); }}
        >
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories added yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-foreground">{c.category_name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* UPGRADE PROMOTION */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1">Own your customers' attention</h3>
            <p className="text-sm text-muted-foreground mb-3">Upgrade your listing to stand out from the competition.</p>
            <Button size="sm" variant="default">Try Upgrading</Button>
          </CardContent>
        </Card>

        {/* CALL TO ACTION */}
        <SectionCard title="Call to Action" onAdd={() => { setEditValue(""); setEditValue2(""); setEditValue3("Call Now"); setEditValue4(""); setEditSection("addCTA"); }}>
          {ctas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a call-to-action to encourage customers to take action</p>
          ) : (
            <div className="space-y-3">
              {ctas.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{c.title}</p>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                    </div>
                    <button onClick={() => removeCTA(c.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2">{c.button_text}</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* BUSINESS INFO */}
        <SectionCard title="Business Info" onEdit={() => setEditSection("businessInfo")}>
          <div className="space-y-3">
            {/* Map preview */}
            <div className="rounded-lg overflow-hidden border border-border h-32 bg-muted">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-79.5,43.6,-79.3,43.7&layer=mapnik`}
                className="w-full h-full border-0"
                title="Map"
              />
            </div>
            <InfoRow icon={MapPin} label="Address" value={profile.address || "Add address"} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone || "Add phone number"} />
            <InfoRow icon={Globe} label="Website" value={profile.website || "Add website"} />
            <InfoRow icon={Link2} label="Menu" value={profile.menu_url || "Add menu link"} />
          </div>
        </SectionCard>

        {/* AMENITIES AND MORE */}
        <SectionCard
          title="Amenities and more"
          onAdd={() => { setEditValue(""); setEditSection("addAmenity"); }}
          extra={amenities.length > 3 ? <button className="text-xs text-primary font-medium">View all ({amenities.length})</button> : null}
        >
          {amenities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add amenities like Wi-Fi, parking, etc.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 6).map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-1">
                  {a.icon && <span>{a.icon}</span>}
                  {a.name}
                  <button onClick={() => removeAmenity(a.id)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </SectionCard>

        {/* BUSINESS HOURS */}
        <SectionCard title="Business Hours" onEdit={openEditHours}>
          {hours.length === 0 ? (
            <p className="text-sm text-muted-foreground">Set your business hours</p>
          ) : (
            <div className="space-y-1.5">
              {DAYS.map((day, i) => {
                const h = hours.find(hr => hr.day_of_week === i);
                return (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-24">{day}</span>
                    <span className="text-foreground font-medium">
                      {!h || h.is_closed ? "Closed" : `${h.open_time?.slice(0, 5)} - ${h.close_time?.slice(0, 5)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* FROM THE BUSINESS */}
        <SectionCard title="From the Business" onEdit={() => setEditSection("fromBusiness")}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Specialties</p>
              <p className="text-sm text-foreground">{profile.specialties || "Describe what your business is known for..."}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">History</p>
              <p className="text-sm text-foreground">{profile.history || "Share when your business started and its story..."}</p>
            </div>
          </div>
        </SectionCard>

        {/* PHOTOS AND VIDEOS */}
        <SectionCard title="Photos and Videos" onAdd={() => photoRef.current?.click()}>
          {media.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Image className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Upload your first photo or video</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 6).map((m) => (
                  <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={m.url} alt={m.caption || ""} className="w-full h-full object-cover" />
                    <button onClick={() => removeMedia(m.id)} className="absolute top-1 right-1 h-6 w-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              {media.length > 6 && (
                <button className="w-full text-center text-sm text-primary font-medium mt-3">See all ({media.length})</button>
              )}
            </div>
          )}
        </SectionCard>

        {/* SLIDESHOW */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Slideshow</h3>
              <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Upgrade</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Create an auto-playing slideshow to showcase your best work.</p>
            <Button size="sm" variant="outline">Learn More</Button>
          </CardContent>
        </Card>

        {/* BUSINESS HIGHLIGHTS */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Business Highlights</h3>
              <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Upgrade</Badge>
            </div>
            {highlights.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {["Happy hour", "Family friendly", "Outdoor seating"].map((h) => (
                  <Badge key={h} variant="outline" className="text-muted-foreground">{h}</Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <Badge key={h.id} variant="secondary">{h.icon && <span className="mr-1">{h.icon}</span>}{h.name}</Badge>
                ))}
              </div>
            )}
            <button className="text-xs text-primary font-medium mt-2">Learn more</button>
          </CardContent>
        </Card>

        {/* BUSINESS STATUS */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${profile.business_status === 'open' ? 'bg-emerald-500' : profile.business_status === 'limited' ? 'bg-amber-500' : 'bg-destructive'}`} />
              <span className="text-sm font-medium text-foreground">
                {profile.business_status === 'open' ? 'Open for business' :
                 profile.business_status === 'limited' ? 'Limited hours' :
                 'Temporarily closed'}
              </span>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setEditSection("status")}>
              Change status
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* EDIT DIALOGS */}

      {/* Add Category */}
      <EditDialog open={editSection === "addCategory"} onClose={() => setEditSection(null)} title="Add Category"
        onSave={() => { if (editValue.trim()) { addCategory(editValue.trim()); setEditSection(null); } }}>
        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="e.g. Restaurant, Coffee Shop..." />
      </EditDialog>

      {/* Add Amenity */}
      <EditDialog open={editSection === "addAmenity"} onClose={() => setEditSection(null)} title="Add Amenity"
        onSave={() => { if (editValue.trim()) { addAmenity(editValue.trim()); setEditSection(null); } }}>
        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="e.g. Free Wi-Fi, Parking..." />
      </EditDialog>

      {/* Add CTA */}
      <EditDialog open={editSection === "addCTA"} onClose={() => setEditSection(null)} title="Add Call to Action"
        onSave={() => { if (editValue.trim()) { addCTA(editValue.trim(), editValue2, editValue3, editValue4); setEditSection(null); } }}>
        <div className="space-y-3">
          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Offer title (e.g. 10% off for new customers)" />
          <Textarea value={editValue2} onChange={(e) => setEditValue2(e.target.value)} placeholder="Description (optional)" rows={2} />
          <Input value={editValue3} onChange={(e) => setEditValue3(e.target.value)} placeholder="Button text (e.g. Call Now)" />
          <Input value={editValue4} onChange={(e) => setEditValue4(e.target.value)} placeholder="Button URL (optional)" />
        </div>
      </EditDialog>

      {/* Edit Business Info */}
      <EditDialog open={editSection === "businessInfo"} onClose={() => setEditSection(null)} title="Edit Business Info"
        onSave={() => { saveProfile({ address: editValue || null, phone: editValue2 || null, website: editValue3 || null, menu_url: editValue4 || null }); setEditSection(null); }}
        onOpen={() => { setEditValue(profile.address || ""); setEditValue2(profile.phone || ""); setEditValue3(profile.website || ""); setEditValue4(profile.menu_url || ""); }}>
        <div className="space-y-3">
          <div><label className="text-sm font-medium text-foreground">Address</label><Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="123 Main St, Toronto, ON" /></div>
          <div><label className="text-sm font-medium text-foreground">Phone</label><Input value={editValue2} onChange={(e) => setEditValue2(e.target.value)} placeholder="(416) 555-0123" /></div>
          <div><label className="text-sm font-medium text-foreground">Website</label><Input value={editValue3} onChange={(e) => setEditValue3(e.target.value)} placeholder="https://example.com" /></div>
          <div><label className="text-sm font-medium text-foreground">Menu Link</label><Input value={editValue4} onChange={(e) => setEditValue4(e.target.value)} placeholder="https://example.com/menu" /></div>
        </div>
      </EditDialog>

      {/* Edit Summary / Profile */}
      <EditDialog open={editSection === "summary"} onClose={() => setEditSection(null)} title="Business Summary"
        onSave={() => { saveProfile({ business_name: editValue || null, primary_category: editValue2 || null, business_description: editValue3 || null }); setEditSection(null); }}
        onOpen={() => { setEditValue(profile.business_name || ""); setEditValue2(profile.primary_category || ""); setEditValue3(profile.business_description || ""); }}>
        <div className="space-y-3">
          <div><label className="text-sm font-medium text-foreground">Business Name</label><Input value={editValue} onChange={(e) => setEditValue(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-foreground">Primary Category</label><Input value={editValue2} onChange={(e) => setEditValue2(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-foreground">Description</label><Textarea value={editValue3} onChange={(e) => setEditValue3(e.target.value)} rows={4} /></div>
        </div>
      </EditDialog>

      {/* Edit From Business */}
      <EditDialog open={editSection === "fromBusiness"} onClose={() => setEditSection(null)} title="From the Business"
        onSave={() => { saveProfile({ specialties: editValue || null, history: editValue2 || null }); setEditSection(null); }}
        onOpen={() => { setEditValue(profile.specialties || ""); setEditValue2(profile.history || ""); }}>
        <div className="space-y-3">
          <div><label className="text-sm font-medium text-foreground">Specialties</label><Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} placeholder="What is your business known for?" /></div>
          <div><label className="text-sm font-medium text-foreground">History</label><Textarea value={editValue2} onChange={(e) => setEditValue2(e.target.value)} rows={3} placeholder="When did the business start?" /></div>
        </div>
      </EditDialog>

      {/* Edit Status */}
      <EditDialog open={editSection === "status"} onClose={() => setEditSection(null)} title="Business Status"
        onSave={() => { saveProfile({ business_status: editValue }); setEditSection(null); }}
        onOpen={() => setEditValue(profile.business_status)}>
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open for business</SelectItem>
            <SelectItem value="limited">Limited hours</SelectItem>
            <SelectItem value="closed">Temporarily closed</SelectItem>
          </SelectContent>
        </Select>
      </EditDialog>

      {/* Edit Hours */}
      <Dialog open={editSection === "hours"} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Business Hours</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {hoursState.map((h, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{DAYS[h.day]}</span>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={h.closed} onChange={(e) => {
                      const next = [...hoursState];
                      next[i] = { ...next[i], closed: e.target.checked };
                      setHoursState(next);
                    }} className="rounded" />
                    Closed
                  </label>
                </div>
                {!h.closed && (
                  <div className="flex gap-2">
                    <Input type="time" value={h.open} onChange={(e) => {
                      const next = [...hoursState];
                      next[i] = { ...next[i], open: e.target.value };
                      setHoursState(next);
                    }} className="flex-1" />
                    <span className="text-muted-foreground self-center">–</span>
                    <Input type="time" value={h.close} onChange={(e) => {
                      const next = [...hoursState];
                      next[i] = { ...next[i], close: e.target.value };
                      setHoursState(next);
                    }} className="flex-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
            <Button onClick={handleSaveHours}>Save Hours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Reusable section card */
function SectionCard({ title, children, onEdit, onAdd, extra }: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onAdd?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            {extra}
            {onEdit && (
              <button onClick={onEdit} className="text-primary"><Pencil className="h-4 w-4" /></button>
            )}
            {onAdd && (
              <button onClick={onAdd} className="text-primary"><Plus className="h-4 w-4" /></button>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function EditDialog({ open, onClose, title, children, onSave, onOpen }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onOpen?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o && onOpen) onOpen(); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
