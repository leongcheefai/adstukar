import type { ChannelPick } from "./catalog";
import { UploadChannel } from "./upload";
import { WallpaperChannel } from "./wallpaper";

export function ChannelLayer({
  channel,
  paused,
}: {
  channel: ChannelPick | null;
  paused: boolean;
}) {
  return (
    <div className="capychannel-channel-layer">
      {channel?.id === "upload" ? <UploadChannel files={channel.files} paused={paused} /> : null}
      {channel?.id === "wallpaper" ? <WallpaperChannel wallpaper={channel.wallpaper} /> : null}
    </div>
  );
}
