export function RssSource({ active }: { active: boolean }) {
  return (
    <div className="src src-rss" data-on={active || undefined}>
      <div className="rss-in">
        <div className="rss-head">
          <h2>Neighbourhood wire</h2>
          <time>Updated 14:02</time>
        </div>
        <div className="rss-item">
          <time>13:58</time>
          <p>
            Night market returns to Selat Road this Friday
            <i>Forty stalls confirmed, road closed from 6pm</i>
          </p>
        </div>
        <div className="rss-item">
          <time>13:12</time>
          <p>
            Library extends opening hours through the exam season
            <i>Open until 11pm on weekdays from Monday</i>
          </p>
        </div>
        <div className="rss-item">
          <time>12:40</time>
          <p>
            New cycle lane opens between Tanah Green and the pier
            <i>Two point four kilometres, fully separated</i>
          </p>
        </div>
        <div className="rss-item">
          <time>11:55</time>
          <p>
            Council votes to keep the Sunday bus free for another year
            <i>Passed nine votes to two</i>
          </p>
        </div>
        <div className="rss-item">
          <time>10:31</time>
          <p>
            Storm drain works begin on Kirkwall Street
            <i>Expect single lane traffic until the end of the month</i>
          </p>
        </div>
      </div>
    </div>
  );
}
