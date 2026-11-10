
import { getAppearance } from "@/lib/appearance";
import { articles } from "@/lib/catalog";
import { ImageCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Culture"
};

export default async function Page() {
  const [stories, visuals] = await Promise.all([
    articles(),
    getAppearance()
  ]);

  return (
    <main>
      <section
        className="page-banner culture-banner cover-managed"
        style={{
          backgroundImage:
            `linear-gradient(90deg, rgba(10,10,10,.86), rgba(10,10,10,.40)), url("${visuals.cultureHero}")`
        }}
      >
        <div className="main-container">
          <p className="eyebrow light">
            KARMA CURATED / THE EDIT
          </p>

          <h1>
            THE CULTURE
            <br />
            <em>NEVER STOPS.</em>
          </h1>

          <p>
            Music. Fashion. People.
            Everything worth paying attention to.
          </p>
        </div>
      </section>

      <section className="main-container section-block">
        <div className="subheading-row">
          <span>FRESH PERSPECTIVES</span>
          <span>
            {stories.length} STORIES
          </span>
        </div>

        <div className="news-grid stories-grid">
          {stories.map(story => (
            <ImageCard
              key={story.slug}
              title={story.title}
              image={story.image}
              href={`/culture/${story.slug}`}
              label={
                story.category.toUpperCase()
              }
              sub={story.author}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
