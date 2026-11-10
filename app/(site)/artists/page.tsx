
import { getAppearance } from "@/lib/appearance";
import { artists } from "@/lib/catalog";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Artists"
};

export default async function Page() {
  const [data, visuals] = await Promise.all([
    artists(),
    getAppearance()
  ]);

  return (
    <main>
      <section
        className="page-banner dark-banner cover-managed"
        style={{
          backgroundImage:
            `linear-gradient(90deg, rgba(10,10,10,.86), rgba(10,10,10,.40)), url("${visuals.artistsHero}")`
        }}
      >
        <div className="main-container">
          <p className="eyebrow light">
            KARMA CURATED / THE ROSTER
          </p>

          <h1>
            THE PEOPLE
            <br />
            <em>BEHIND THE SOUND.</em>
          </h1>

          <p>
            Independent voices.
            Unfiltered expression.
            Discover the artists moving
            culture forward.
          </p>
        </div>
      </section>

      <section className="main-container section-block">
        <div className="subheading-row">
          <span>ARTIST DIRECTORY</span>
          <span>
            {String(data.length).padStart(2, "0")}
            {" "}
            PROFILES
          </span>
        </div>

        <div className="artist-grid expanded">
          {data.map((artist, index) => (
            <Link
              href={`/artists/${artist.slug}`}
              className="artist-card"
              key={artist.slug}
            >
              <img
                alt={artist.name}
                src={artist.image}
              />

              <div className="artist-overlay">
                <span className="artist-number">
                  {String(index + 1).padStart(2, "0")}
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
          ))}
        </div>
      </section>
    </main>
  );
}
