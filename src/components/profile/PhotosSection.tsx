import { useRef, useState } from "react";
import { Plus, X, Loader2, ImageIcon } from "lucide-react";
import type { ProviderPhoto } from "@/hooks/useProviderProfile";

interface Props {
  photos: ProviderPhoto[];
  onUpload: (file: File) => Promise<string | null>;
  onAddPhoto: (url: string, caption?: string) => Promise<void>;
  onRemove: (id: string, url: string) => Promise<void>;
}

export default function PhotosSection({ photos, onUpload, onAddPhoto, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue;
      const url = await onUpload(file);
      if (url) {
        await onAddPhoto(url);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Upload at least 4 photos of your work. Before/after photos are highly recommended — they boost conversion significantly.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border">
            <img
              src={photo.url}
              alt={photo.caption || "Work photo"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              onClick={() => onRemove(photo.id, photo.url)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span className="text-[10px]">Add photo</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {photos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
          <p className="text-sm">No photos yet</p>
        </div>
      )}
    </div>
  );
}
