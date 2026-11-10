
import { getAppearance } from "@/lib/appearance";
import { events } from "@/lib/catalog";
import { EventCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events"
};

export default async function Page() {
  const [eventData, visuals] =
    await Promise.all([
      events(),
      getAppearance()
    ]);

  return (
    <main>
      <section
        className="page-banner events-banner cover-managed"
        style={{
          backgroundImage:
            `linear-gradient(90deg, rgba(10,10,10,.86), rgba(10,10,10,.40)), url("${visuals.eventsHero}")`
        }}
      >
        <div className="main-container">
          <p className="eyebrow light">
            KARMA CURATED / EXPERIENCE
          </p>

          <h1>
            YOU HAD
            <br />
            <em>TO BE THERE.</em>
          </h1>

          <p>
            The moments make the movement.
            Find your next night out.
          </p>
        </div>
      </section>

      <section className="main-container section-block">
        <div className="subheading-row">
          <span>THE UPCOMING</span>
          <span>SHOW UP / FEEL IT</span>
        </div>

        <div className="event-grid">
          {eventData.map(event => (
            <EventCard
              event={event}
              key={event.slug}
            />
          ))}
        </div>

        {!eventData.length && (
          <p>
            Nothing scheduled yet.
            Check back for upcoming events.
          </p>
        )}
      </section>
    </main>
  );
}
