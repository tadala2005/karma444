
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Plus,
  Trash2,
  Save,
  ArrowUpRight,
  Image as ImageIcon,
  Layers3,
  Package
} from "lucide-react";

import { slugify } from "@/lib/format";
import { MediaUpload } from "./media-upload";
import { IMAGE_SLOTS } from "@/lib/media-slots";
import type { ImageSlot } from "@/lib/media-slots";
import type { VariantInput } from "@/lib/variants";

type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "textarea"
    | "date"
    | "url"
    | "checkbox"
    | "image";
  required?: boolean;
};

const definitions: Record<string, Field[]> = {
  products: [
    { name: "name", label: "Product name", required: true },
    { name: "slug", label: "URL slug", required: true },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: "Main marketing image",
      type: "image",
      required: true
    },
    {
      name: "category",
      label: "Category (e.g. Headwear)",
      required: true
    },
    {
      name: "price",
      label: "Price in MWK",
      type: "number",
      required: true
    },
    {
      name: "stock",
      label: "Stock (used only without variants)",
      type: "number",
      required: true
    },
    {
      name: "featured",
      label: "Feature on homepage",
      type: "checkbox"
    }
  ],
  artists: [
    { name: "name", label: "Artist name", required: true },
    { name: "slug", label: "URL slug", required: true },
    {
      name: "bio",
      label: "Artist biography",
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: "Artist portrait",
      type: "image",
      required: true
    },
    { name: "genre", label: "Genre", required: true },
    { name: "city", label: "City", required: true },
    { name: "instagram", label: "Instagram URL", type: "url" },
    { name: "spotify", label: "Music URL", type: "url" },
    { name: "featured", label: "Featured", type: "checkbox" }
  ],
  articles: [
    { name: "title", label: "Story title", required: true },
    { name: "slug", label: "URL slug", required: true },
    {
      name: "excerpt",
      label: "Summary",
      type: "textarea",
      required: true
    },
    {
      name: "body",
      label: "Article body",
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: "Story cover image",
      type: "image",
      required: true
    },
    { name: "category", label: "Category", required: true },
    { name: "author", label: "Author name", required: true },
    { name: "featured", label: "Featured", type: "checkbox" }
  ],
  events: [
    { name: "title", label: "Event title", required: true },
    { name: "slug", label: "URL slug", required: true },
    {
      name: "summary",
      label: "Event description",
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: "Event poster",
      type: "image",
      required: true
    },
    { name: "venue", label: "Venue", required: true },
    { name: "city", label: "City", required: true },
    {
      name: "date",
      label: "Event date and time",
      type: "date",
      required: true
    },
    {
      name: "price",
      label: "Ticket price (MWK, 0 = RSVP)",
      type: "number",
      required: true
    },
    {
      name: "capacity",
      label: "Total capacity",
      type: "number",
      required: true
    },
    { name: "featured", label: "Featured", type: "checkbox" }
  ]
};

const paths: Record<string, string> = {
  products: "/shop/",
  artists: "/artists/",
  articles: "/culture/",
  events: "/events/"
};

type RecordItem = {
  id: string;
  slug: string;
  title?: string;
  name?: string;
  variants?: VariantInput[];
  gallery?: string[];
  [key: string]: unknown;
};

type Props = {
  data: Record<string, RecordItem[]>;
  appearance: Record<ImageSlot, string>;
};

export function AdminPanel({
  data,
  appearance: initialAppearance
}: Props) {
  const router = useRouter();

  const [tab, setTab] = useState("products");
  const [fields, setFields] = useState<
    Record<string, string | boolean>
  >({ featured: false });

  const [gallery, setGallery] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const [appearance, setAppearance] =
    useState<Record<ImageSlot, string>>(
      initialAppearance
    );

  const [savingSlot, setSavingSlot] = useState("");
  const [appearanceMessage, setAppearanceMessage] =
    useState("");

  const titleKey =
    tab === "articles" || tab === "events"
      ? "title"
      : "name";

  function reset() {
    setFields({ featured: false });
    setGallery([]);
    setVariants([]);
    setEditing(null);
    setError("");
    setMessage("");
  }

  function switchTab(value: string) {
    setTab(value);
    reset();
  }

  function setField(
    name: string,
    value: string | boolean
  ) {
    setFields(old => ({
      ...old,
      [name]: value,
      ...(
        name === titleKey && !editing
          ? { slug: slugify(String(value)) }
          : {}
      )
    }));
  }

  function changeVariant(
    index: number,
    key: keyof VariantInput,
    value: string
  ) {
    setVariants(current =>
      current.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [key]:
                key === "stock"
                  ? Math.max(0, Number(value) || 0)
                  : value
            }
          : variant
      )
    );
  }

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload: Record<string, unknown> = {
        ...fields
      };

      for (const field of definitions[tab]) {
        if (field.type === "number") {
          payload[field.name] = Number(
            fields[field.name] || 0
          );
        }

        if (field.type === "checkbox") {
          payload[field.name] = Boolean(
            fields[field.name]
          );
        }
      }

      if (tab === "products") {
        payload.gallery = gallery;
        payload.variants = variants;
      }

      if (tab === "events" && fields.date) {
        payload.date = new Date(
          String(fields.date)
        ).toISOString();
      }

      const url = editing
        ? `/api/admin/${tab}/${editing}`
        : `/api/admin/${tab}`;

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body.error || "Unable to publish"
        );
      }

      setMessage(
        editing
          ? "Entry updated successfully."
          : "Entry published successfully."
      );

      setFields({ featured: false });
      setVariants([]);
      setGallery([]);
      setEditing(null);

      router.refresh();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save"
      );

    } finally {
      setBusy(false);
    }
  }

  async function remove(item: RecordItem) {
    if (
      !confirm(
        `Delete ${item.name || item.title}? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `/api/admin/${tab}/${item.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(
          body.error || "Delete failed"
        );
      }

      router.refresh();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Delete failed"
      );
    }
  }

  function startEdit(item: RecordItem) {
    setEditing(item.id);
    setError("");
    setMessage("");

    const next: Record<string, string | boolean> = {};

    for (const field of definitions[tab]) {
      if (field.name === "date") {
        next.date = item.date
          ? new Date(
              String(item.date)
            ).toISOString().slice(0, 16)
          : "";

      } else {
        next[field.name] =
          (
            item[field.name] as
              | string
              | boolean
              | undefined
          ) ??
          (field.type === "checkbox" ? false : "");
      }
    }

    setFields(next);

    setVariants(
      (item.variants || []).map(variant => ({
        size: variant.size,
        color: variant.color,
        stock: variant.stock
      }))
    );

    setGallery(item.gallery || []);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function saveAppearance(
    key: ImageSlot,
    url: string
  ) {
    setSavingSlot(key);
    setAppearanceMessage("");

    try {
      const response = await fetch(
        "/api/admin/appearance",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            key,
            url
          })
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body.error || "Unable to update cover"
        );
      }

      setAppearance(old => ({
        ...old,
        [key]: url
      }));

      setAppearanceMessage(
        "Image published successfully."
      );

      router.refresh();

    } catch (error) {
      setAppearanceMessage(
        error instanceof Error
          ? error.message
          : "Unable to update cover"
      );

    } finally {
      setSavingSlot("");
    }
  }

  return (
    <div className="admin-content">
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Content management"
      >
        {Object.keys(definitions).map(key => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === key}
            key={key}
            className={
              tab === key ? "selected" : ""
            }
            onClick={() => switchTab(key)}
          >
            {key.toUpperCase()}
            <span>
              {data[key]?.length || 0}
            </span>
          </button>
        ))}

        <button
          type="button"
          role="tab"
          aria-selected={tab === "appearance"}
          className={
            tab === "appearance" ? "selected" : ""
          }
          onClick={() => switchTab("appearance")}
        >
          <ImageIcon size={16} />
          APPEARANCE
        </button>
      </div>

      {tab === "appearance" ? (
        <div className="appearance-panel">
          <div className="admin-module-title">
            <p className="eyebrow">
              KARMA CURATED / ART DIRECTION
            </p>

            <h3>CONTROL THE VISUALS.</h3>

            <p>
              Upload photographs to change the
              visuals across your website.
              No code editing required.
            </p>
          </div>

          {appearanceMessage && (
            <p
              className="success-msg"
              role="status"
            >
              {appearanceMessage}
            </p>
          )}

          <div className="appearance-grid">
            {IMAGE_SLOTS.map(slot => (
              <div
                className="appearance-card"
                key={slot.key}
              >
                <div className="appearance-thumb">
                  <img
                    src={appearance[slot.key]}
                    alt={slot.title}
                  />
                </div>

                <div className="appearance-body">
                  <span className="eyebrow">
                    RECOMMENDED / {slot.ratio}
                  </span>

                  <h4>{slot.title}</h4>
                  <p>{slot.description}</p>

                  <MediaUpload
                    compact
                    value={appearance[slot.key]}
                    onUploaded={url =>
                      void saveAppearance(
                        slot.key,
                        url
                      )
                    }
                  />

                  {savingSlot === slot.key && (
                    <small>
                      Saving to website...
                    </small>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-cols">
          <div className="admin-form">
            <p className="eyebrow">
              {editing
                ? "EDIT EXISTING"
                : "PUBLISH NEW"}{" "}
              / {tab.toUpperCase()}
            </p>

            <h3>
              {editing
                ? "EDIT ENTRY"
                : "CREATE CONTENT."}
            </h3>

            <form
              onSubmit={submit}
              className="admin-fields"
            >
              {definitions[tab].map(field =>
                field.type === "image" ? (
                  <div
                    className="admin-image-field"
                    key={field.name}
                  >
                    <span>
                      {field.label.toUpperCase()}
                    </span>

                    <MediaUpload
                      value={String(
                        fields[field.name] || ""
                      )}
                      onUploaded={url =>
                        setField(field.name, url)
                      }
                    />

                    {field.required &&
                      !fields[field.name] && (
                        <span className="media-help">
                          Upload an image before
                          publishing.
                        </span>
                      )}
                  </div>
                ) : (
                  <label key={field.name}>
                    {field.label.toUpperCase()}

                    {field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(
                          fields[field.name]
                        )}
                        onChange={event =>
                          setField(
                            field.name,
                            event.target.checked
                          )
                        }
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        rows={
                          field.name === "body"
                            ? 8
                            : 3
                        }
                        required={field.required}
                        value={String(
                          fields[field.name] ?? ""
                        )}
                        onChange={event =>
                          setField(
                            field.name,
                            event.target.value
                          )
                        }
                      />
                    ) : (
                      <input
                        type={
                          field.type === "date"
                            ? "datetime-local"
                            : field.type || "text"
                        }
                        required={
                          field.required &&
                          !(
                            field.name === "stock" &&
                            variants.length > 0
                          )
                        }
                        min={
                          field.type === "number"
                            ? 0
                            : undefined
                        }
                        value={String(
                          fields[field.name] ?? ""
                        )}
                        onChange={event =>
                          setField(
                            field.name,
                            event.target.value
                          )
                        }
                      />
                    )}
                  </label>
                )
              )}

              {tab === "products" && (
                <>
                  <div className="admin-addon">
                    <div className="admin-addon-head">
                      <div>
                        <p className="eyebrow">
                          MARKETING / GALLERY
                        </p>
                        <h4>
                          ADDITIONAL PHOTOS
                        </h4>
                      </div>

                      <Layers3 size={20} />
                    </div>

                    <p>
                      These photographs are for
                      marketing. Customers choose
                      their size and color separately.
                    </p>

                    <div className="gallery-chips">
                      {gallery.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                        >
                          <img
                            src={url}
                            alt={`Product photo ${index + 1}`}
                          />

                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() =>
                              setGallery(
                                gallery.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {gallery.length < 10 && (
                      <MediaUpload
                        compact
                        onUploaded={url =>
                          setGallery(current => [
                            ...current,
                            url
                          ])
                        }
                        label="ADD GALLERY PHOTO"
                      />
                    )}
                  </div>

                  <div className="admin-addon">
                    <div className="admin-addon-head">
                      <div>
                        <p className="eyebrow">
                          MERCH / CUSTOMISATION
                        </p>

                        <h4>
                          SIZES, COLORS & STOCK
                        </h4>
                      </div>

                      <Package size={20} />
                    </div>

                    <p>
                      Create each available
                      size/color combination.
                      For example: ONE SIZE,
                      BLACK, 15 in stock.
                    </p>

                    {variants.map(
                      (variant, index) => (
                        <div
                          key={index}
                          className="variant-editor-row"
                        >
                          <label>
                            SIZE
                            <input
                              required
                              value={variant.size}
                              placeholder="ONE SIZE / S / M"
                              onChange={event =>
                                changeVariant(
                                  index,
                                  "size",
                                  event.target.value
                                )
                              }
                            />
                          </label>

                          <label>
                            COLOR
                            <input
                              required
                              value={variant.color}
                              placeholder="BLACK"
                              onChange={event =>
                                changeVariant(
                                  index,
                                  "color",
                                  event.target.value
                                )
                              }
                            />
                          </label>

                          <label>
                            STOCK
                            <input
                              required
                              type="number"
                              min="0"
                              max="100000"
                              value={variant.stock}
                              onChange={event =>
                                changeVariant(
                                  index,
                                  "stock",
                                  event.target.value
                                )
                              }
                            />
                          </label>

                          <button
                            type="button"
                            aria-label="Remove combination"
                            onClick={() =>
                              setVariants(
                                variants.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      )
                    )}

                    <button
                      type="button"
                      className="btn outline"
                      onClick={() =>
                        setVariants(current => [
                          ...current,
                          {
                            size: "ONE SIZE",
                            color: "",
                            stock: 0
                          }
                        ])
                      }
                    >
                      <Plus size={16} />
                      ADD SIZE + COLOR
                    </button>

                    {variants.length > 0 && (
                      <p className="variant-stock-total">
                        TOTAL AVAILABLE STOCK:{" "}
                        <b>
                          {variants.reduce(
                            (sum, v) =>
                              sum +
                              (Number(v.stock) || 0),
                            0
                          )}
                        </b>
                      </p>
                    )}
                  </div>
                </>
              )}

              {error && (
                <p
                  className="error-msg"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  className="success-msg"
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                disabled={busy}
                className="btn orange fill"
              >
                {editing ? (
                  <Save size={16} />
                ) : (
                  <Plus size={16} />
                )}

                {busy
                  ? "SAVING..."
                  : editing
                    ? "SAVE CHANGES"
                    : "PUBLISH ENTRY"}
              </button>

              {editing && (
                <button
                  type="button"
                  className="btn outline"
                  onClick={reset}
                >
                  CANCEL EDIT
                </button>
              )}
            </form>
          </div>

          <div className="admin-list">
            <p className="eyebrow">
              PUBLISHED CONTENT
            </p>

            <h3>
              MANAGE {tab.toUpperCase()}.
            </h3>

            {data[tab]?.length ? (
              data[tab].map(item => (
                <div
                  className="admin-list-row"
                  key={item.id}
                >
                  <div className="admin-list-primary">
                    {Boolean(item.image) && (
                      <img
                        src={String(item.image)}
                        alt=""
                      />
                    )}

                    <div>
                      <b>
                        {item.title || item.name}
                      </b>

                      <span>{item.slug}</span>
                    </div>
                  </div>

                  <div>
                    <a
                      href={`${paths[tab]}${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View public page"
                    >
                      <ArrowUpRight size={17} />
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(item)
                      }
                    >
                      EDIT
                    </button>

                    <button
                      type="button"
                      className="red-action"
                      onClick={() =>
                        void remove(item)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-empty">
                No entries yet. Publish your
                first piece of content.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
