
import { getAppearance } from "@/lib/appearance";

import {
  ArrowUpRight,
  Radio,
  Clapperboard,
  Camera,
  HeartHandshake
} from "lucide-react";

import {
  BookingForm
} from "@/components/booking-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Karma Curated Studio"
};

const services = [
  {
    number: "01",
    name: "ARTIST CAMPAIGNS",
    description:
      "Release rollouts, artist strategy and the attention your music deserves.",
    icon: Radio
  },
  {
    number: "02",
    name: "BRAND & SOCIAL",
    description:
      "Content strategy, social distribution and cultural relevance.",
    icon: HeartHandshake
  },
  {
    number: "03",
    name: "CREATIVE DIRECTION",
    description:
      "Visual identity, strong concepts and campaigns that mean something.",
    icon: Camera
  },
  {
    number: "04",
    name: "EVENT PROMOTION",
    description:
      "Build an audience before the doors open and keep the momentum going.",
    icon: Clapperboard
  }
];

export default async function Page() {
  const visuals = await getAppearance();

  return (
    <main>
      <section
        className="page-banner studio-banner cover-managed"
        style={{
          backgroundImage:
            `linear-gradient(90deg, rgba(10,10,10,.86), rgba(10,10,10,.40)), url("${visuals.studioHero}")`
        }}
      >
        <div className="main-container">
          <p className="eyebrow light">
            KARMA CURATED / CREATIVE STUDIO
          </p>

          <h1>
            IDEAS THAT
            <br />
            <em>MOVE CULTURE.</em>
          </h1>

          <p>
            For artists, brands and people
            with something to say.
          </p>
        </div>
      </section>

      <section className="main-container section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              WHAT WE DO
            </p>

            <h2>MAKE IT MATTER.</h2>
          </div>
        </div>

        <div className="services-grid">
          {services.map(service => {
            const Icon = service.icon;

            return (
              <div
                className="service-card"
                key={service.number}
              >
                <div className="service-top">
                  <span>
                    {service.number}
                    {" / "}
                    KARMA CURATED STUDIO
                  </span>

                  <Icon size={26} />
                </div>

                <h3>{service.name}</h3>
                <p>{service.description}</p>

                <ArrowUpRight size={22} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="studio-contact">
        <div className="main-container studio-contact-inner">
          <div>
            <p className="eyebrow light">
              THE NEXT PROJECT STARTS HERE
            </p>

            <h2>
              LET'S MAKE
              <br />
              <em>
                SOMETHING
                <br />
                HAPPEN.
              </em>
            </h2>

            <p>
              Tell us what you've got in mind.
              Good ideas always start with
              a conversation.
            </p>
          </div>

          <div className="studio-form-card">
            <p className="eyebrow">
              WORK WITH US
            </p>

            <h3>THE BRIEF.</h3>

            <BookingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
