export function AlbumSource({ active }: { active: boolean }) {
  return (
    <div className="src src-album" data-on={active || undefined}>
      <div className="photo photo-beach" />
      <div className="photo photo-night" />
      <div className="photo photo-market" />
      <div className="photo photo-portrait" />
    </div>
  );
}
