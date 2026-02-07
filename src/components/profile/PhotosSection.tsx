import { useRef, useState } from "react";
import { Plus, X, Loader2, ImageIcon, Video, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProviderPhoto, ProviderProfile } from "@/hooks/useProviderProfile";

interface Props {
  photos: ProviderPhoto[];
  profile: ProviderProfile;
  saving: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onAddPhoto: (url: string, caption?: string) => Promise<void>;
  onRemove: (id: string, url: string) => Promise<void>;
  onSaveProfile: (updates: Partial<ProviderProfile>) => Promise<void>;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function PhotosSection({
  photos,
  profile,
  saving,
  onUpload,
  onAddPhoto,
  onRemove,
  onSaveProfile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Video state
  const [videosEnabled, setVideosEnabled] = useState(
    (profile.video_urls && profile.video_urls.length > 0) || false
  );
  const [videoInput, setVideoInput] = useState("");

  const videoUrls = profile.video_urls || [];

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

  const handleAddVideo = async () => {
    const url = videoInput.trim();
    if (!url) return;
    const ytId = extractYoutubeId(url);
    if (!ytId) return;

    const newUrls = [...videoUrls, url];
    await onSaveProfile({ video_urls: newUrls });
    setVideoInput("");
  };

  const handleRemoveVideo = async (index: number) => {
    const newUrls = videoUrls.filter((_, i) => i !== index);
    await onSaveProfile({ video_urls: newUrls.length > 0 ? newUrls : null });
  };

  return (
    <div className="space-y-6">
      {/* Photos sub-section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Photos</h3>
        <p className="text-xs text-muted-foreground">
          A picture can paint a thousand words — images such as a company logo,
          team photo and product photos are important to include in your profile.
          For certain services, this is often what customers look for first —
          previous projects, locations and venues, or before and after shots for
          example.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden border"
            >
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

      {/* Videos sub-section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Videos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Optional</p>
          </div>
          <Switch checked={videosEnabled} onCheckedChange={setVideosEnabled} />
        </div>

        {videosEnabled && (
          <>
            <p className="text-xs text-muted-foreground">
              Add YouTube videos to showcase your work and expertise — videos of
              previous events for example.
            </p>

            {/* Existing videos */}
            {videoUrls.length > 0 && (
              <div className="space-y-2">
                {videoUrls.map((url, i) => {
                  const ytId = extractYoutubeId(url);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border bg-card p-2"
                    >
                      {ytId ? (
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
                          alt="Video thumbnail"
                          className="h-10 w-14 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                          <Play className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                        {url}
                      </p>
                      <button
                        onClick={() => handleRemoveVideo(i)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add video input */}
            <div className="flex gap-2">
              <Input
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button
                onClick={handleAddVideo}
                disabled={!videoInput.trim() || !extractYoutubeId(videoInput) || saving}
                size="default"
              >
                Add
              </Button>
            </div>

            {videoInput.trim() && !extractYoutubeId(videoInput) && (
              <p className="text-xs text-destructive">
                Please enter a valid YouTube URL
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
