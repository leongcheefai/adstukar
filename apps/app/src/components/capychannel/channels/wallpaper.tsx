import type { WallpaperId } from "./catalog";

export function WallpaperChannel({ wallpaper }: { wallpaper: WallpaperId }) {
  return (
    <div className={`chan wall wall-${wallpaper}`}>
      {wallpaper === "firepit" ? (
        <>
          <div className="ember ember-c" />
          <div className="ember ember-a" />
          <div className="ember ember-b" />
        </>
      ) : null}
    </div>
  );
}
