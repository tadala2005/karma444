
export const IMAGE_SLOTS = [
  {
    key: "homeHero",
    title: "Homepage Hero",
    description: "Main homepage cover photograph",
    ratio: "16:10"
  },
  {
    key: "homeStatement",
    title: "Homepage Fashion Feature",
    description: "Lifestyle campaign photograph",
    ratio: "4:5"
  },
  {
    key: "shopHero",
    title: "Shop Banner",
    description: "Main merchandise collection image",
    ratio: "4:5"
  },
  {
    key: "artistsHero",
    title: "Artists Banner",
    description: "Artist directory background",
    ratio: "16:9"
  },
  {
    key: "cultureHero",
    title: "Culture Banner",
    description: "Editorial and culture background",
    ratio: "16:9"
  },
  {
    key: "eventsHero",
    title: "Events Banner",
    description: "Events directory background",
    ratio: "16:9"
  },
  {
    key: "studioHero",
    title: "Studio Banner",
    description: "Creative services background",
    ratio: "16:9"
  },
  {
    key: "authHero",
    title: "Account Background",
    description: "Login and registration image",
    ratio: "4:5"
  }
] as const;

export type ImageSlot =
  (typeof IMAGE_SLOTS)[number]["key"];

export const IMAGE_SLOT_KEYS =
  new Set<string>(
    IMAGE_SLOTS.map(slot => slot.key)
  );

export const DEFAULT_IMAGES:
  Record<ImageSlot, string> = {
    homeHero:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1800&q=85",

    homeStatement:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85",

    shopHero:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1100&q=85",

    artistsHero:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1800&q=85",

    cultureHero:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1800&q=85",

    eventsHero:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=85",

    studioHero:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1600&q=85",

    authHero:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1400&q=85"
  };
