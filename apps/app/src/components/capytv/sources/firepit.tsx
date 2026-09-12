export function FirepitSource({ active }: { active: boolean }) {
  return (
    <div className="src src-firepit" data-on={active || undefined}>
      <div className="ember ember-c" />
      <div className="ember ember-a" />
      <div className="ember ember-b" />
    </div>
  );
}
