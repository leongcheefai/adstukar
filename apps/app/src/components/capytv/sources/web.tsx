export function WebSource({ active }: { active: boolean }) {
  return (
    <div className="src src-web" data-on={active || undefined}>
      <div className="web-nav">
        <span className="web-logo">Harborline</span>
        <span>Routes</span>
        <span>Fares</span>
        <span>Live map</span>
        <span>Help</span>
      </div>
      <div className="web-hero">
        <h1>Ferries every twenty minutes</h1>
        <p>
          Six terminals, one ticket. Track your boat in real time and board with the pass already on
          your phone.
        </p>
      </div>
      <div className="web-cards">
        <div className="web-card">
          <b>Live departures</b>
          <span>Next boat to East Quay leaves in 8 minutes from Pier 3.</span>
        </div>
        <div className="web-card">
          <b>Day pass</b>
          <span>Unlimited hops across every route until midnight.</span>
        </div>
        <div className="web-card">
          <b>Service notice</b>
          <span>North Head is closed for maintenance until Friday.</span>
        </div>
      </div>
      <div className="web-cookie">
        <span>We use cookies to remember your route and keep you signed in.</span>
        <button type="button">Accept all</button>
      </div>
    </div>
  );
}
