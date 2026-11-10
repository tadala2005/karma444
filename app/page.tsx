
import Link from "next/link";

import {
  ArrowUpRight,
  ArrowRight
} from "lucide-react";

import {
  artists,
  articles,
  events,
  products
} from "@/lib/catalog";

import {
  getAppearance
} from "@/lib/appearance";

import {
  SectionTitle,
  ImageCard,
  ProductCard,
  EventCard
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    artistData,
    news,
    eventData,
    merchandise,
    visuals
  ] = await Promise.all([
    artists(),
    articles(),
    events(),
    products(),
    getAppearance()
  ]);

  return (
    <main>
      <section className="hero">
        <div className="hero-side">
          <p className="eyebrow light">
            THE INDEPENDENT CULTURE PLATFORM
          </p>

          <div className="hero-heading">
            WHAT
            <br />
            YOU
            <br />
            <em>
              DESERVE
              <span>.</span>
            </em>
          </div>

          <div className="hero-side-bottom">
            <span>
              DISCOVER THE NEXT.
              <br />
              WEAR THE CULTURE.
            </span>

            <Link
              className="hero-cta"
              href="/culture"
            >
              EXPLORE THE CULTURE
              <ArrowUpRight size={22} />
            </Link>
          </div>
        </div>

        <div className="hero-photo">
          <img
            src={visuals.homeHero}
            alt="Karma Curated editorial cover"
          />

          <div className="hero-photo-top">
            <span>ISSUE 001 / MALAWI</span>
            <span>EST. FOR THE CULTURE</span>
          </div>

          <div className="hero-caption">
            <span className="eyebrow light">
              THE SOUND OF THE MOMENT
            </span>

            <h2>
              THE CULTURE
              <br />
              IS OURS.
            </h2>

            <Link href="/artists">
              MEET THE ARTISTS
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      <div className="marquee">
        <div>
          KARMA CURATED IS CULTURE ✳
          {" "}
          WE CREATE THE MOMENT ✳
          {" "}
          GOOD THINGS COME AROUND ✳
          {" "}
          KARMA CURATED IS CULTURE ✳
        </div>
      </div>

      {news.length > 0 && (
        <section className="main-container section-block">
          <SectionTitle
            label="01 / THE EDIT"
            title="NOW IN CULTURE."
            href="/culture"
            action="ALL STORIES"
          />

          <div className="news-grid">
            {news.slice(0, 3).map(
              (story, index) => (
                <div
                  key={story.slug}
                  className={
                    index === 0
                      ? "news-feature"
                      : ""
                  }
                >
                  <ImageCard
                    image={story.image}
                    title={story.title}
                    label={
                      story.category.toUpperCase()
                    }
                    href={`/culture/${story.slug}`}
                    sub="KARMA CURATED EDITORIAL"
                  />
                </div>
              )
            )}
          </div>
        </section>
      )}

      {artistData.length > 0 && (
        <section className="dark-section">
          <div className="main-container section-block">
            <SectionTitle
              label="02 / THE ROSTER"
              title="THE NEXT UP."
              href="/artists"
              action="DISCOVER ARTISTS"
            />

            <div className="artist-grid">
              {artistData.slice(0, 3).map(
                (artist, index) => (
                  <Link
                    key={artist.slug}
                    href={`/artists/${artist.slug}`}
                    className="artist-card"
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                    />

                    <div className="artist-overlay">
                      <span className="artist-number">
                        0{index + 1}
                        {" / "}
                        {artist.city.toUpperCase()}
                      </span>

                      <div>
                        <h3>{artist.name}</h3>
                        <p>
                          {artist.genre.toUpperCase()}
                        </p>
                      </div>

                      <ArrowUpRight size={25} />
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {merchandise.length > 0 && (
        <section className="main-container section-block">
          <SectionTitle
            label="03 / THE DROP"
            title="WEAR YOUR KARMA."
            href="/shop"
            action="SHOP ALL"
          />

          <div className="product-grid">
            {merchandise.slice(0, 3).map(
              item => (
                <ProductCard
                  key={item.slug}
                  product={item}
                />
              )
            )}
          </div>
        </section>
      )}

      <section className="statement">
        <div className="statement-image">
          <img
            src={visuals.homeStatement}
            alt="Karma Curated lifestyle campaign"
          />
        </div>

        <div className="statement-copy">
          <p className="eyebrow">
            UNAPOLOGETICALLY US
          </p>

          <h2>
            MORE THAN
            <br />
            A BRAND.
            <br />
            <em>A WAY OF LIFE.</em>
          </h2>

          <p>
            A space for the artists,
            designers, creators and
            people making culture happen.
          </p>

          <Link
            className="btn light"
            href="/studio"
          >
            WORK WITH KARMA CURATED
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      {eventData.length > 0 && (
        <section className="main-container section-block">
          <SectionTitle
            label="04 / ON THE CALENDAR"
            title="SHOW UP. FEEL IT."
            href="/events"
            action="ALL EVENTS"
          />

          <div className="event-grid">
            {eventData.slice(0, 2).map(
              event => (
                <EventCard
                  key={event.slug}
                  event={event}
                />
              )
            )}
          </div>
        </section>
      )}

      <section className="newsletter-band">
        <div className="main-container newsletter-inner">
          <div>
            <p className="eyebrow">
              THE FUTURE'S A GROUP PROJECT.
            </p>

            <h2>
              CREATORS, MEET
              <br />
              YOUR PLATFORM.
            </h2>
          </div>

          <Link
            href="/studio"
            className="btn dark"
          >
            BUILD SOMETHING WITH US
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  );
}
