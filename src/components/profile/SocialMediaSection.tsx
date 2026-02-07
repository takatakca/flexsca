import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderProfile } from "@/hooks/useProviderProfile";

interface Props {
  profile: ProviderProfile;
  saving: boolean;
  onSave: (updates: Partial<ProviderProfile>) => Promise<void>;
}

export default function SocialMediaSection({ profile, saving, onSave }: Props) {
  const [socialEnabled, setSocialEnabled] = useState(
    !!(profile.facebook_url || profile.twitter_handle || profile.instagram_handle)
  );
  const [linksEnabled, setLinksEnabled] = useState(!!profile.website_links);

  const [facebook, setFacebook] = useState(profile.facebook_url || "");
  const [twitter, setTwitter] = useState(profile.twitter_handle || "");
  const [instagram, setInstagram] = useState(profile.instagram_handle || "");
  const [links, setLinks] = useState(profile.website_links || "");

  // Sync if profile reloads
  useEffect(() => {
    setFacebook(profile.facebook_url || "");
    setTwitter(profile.twitter_handle || "");
    setInstagram(profile.instagram_handle || "");
    setLinks(profile.website_links || "");
  }, [profile.facebook_url, profile.twitter_handle, profile.instagram_handle, profile.website_links]);

  const handleSave = () => {
    onSave({
      facebook_url: socialEnabled ? facebook.trim() || null : null,
      twitter_handle: socialEnabled ? twitter.trim() || null : null,
      instagram_handle: socialEnabled ? instagram.trim() || null : null,
      website_links: linksEnabled ? links.trim() || null : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Social media block */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Social media</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Optional</p>
          </div>
          <Switch checked={socialEnabled} onCheckedChange={setSocialEnabled} />
        </div>

        {socialEnabled && (
          <>
            <p className="text-xs text-muted-foreground">
              Add your company social media accounts to lend credibility to your
              business — it is often something customers will look for to validate
              their hiring decisions.
            </p>

            {/* Facebook */}
            <div>
              <Label className="text-xs font-medium">Facebook</Label>
              <Input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="//www.facebook.com/yourpage"
                className="mt-1"
              />
            </div>

            {/* Twitter / X */}
            <div>
              <Label className="text-xs font-medium">Twitter / X</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Username"
                  className="pl-8"
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <Label className="text-xs font-medium">Instagram</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Username"
                  className="pl-8"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Links block */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Links</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Optional</p>
          </div>
          <Switch checked={linksEnabled} onCheckedChange={setLinksEnabled} />
        </div>

        {linksEnabled && (
          <>
            <p className="text-xs text-muted-foreground">
              Link to your own website, articles about your business, or any
              other content that will help promote your business.
            </p>

            <Textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Enter one link per line"
              rows={4}
            />
          </>
        )}
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
