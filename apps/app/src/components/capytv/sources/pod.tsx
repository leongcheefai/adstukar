export function PodSource({ active }: { active: boolean }) {
  return (
    <div className="src src-pod" data-on={active || undefined}>
      <div className="pod-in">
        <div className="pod-art" />
        <div className="pod-meta">
          <div className="pod-eyebrow">Now playing · Episode 214</div>
          <h1 className="pod-title">The people who fix the machines that fix the machines</h1>
          <p className="pod-by">Slow Signal · with Marisol Vane</p>
        </div>
      </div>
      <div className="pod-bar">
        <div className="pod-track">
          <div className="pod-fill" />
        </div>
        <div className="pod-times">
          <span>24:18</span>
          <span>-38:52</span>
        </div>
      </div>
    </div>
  );
}
