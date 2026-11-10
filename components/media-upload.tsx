
"use client";

import {
  useState
} from "react";

import {
  ImagePlus,
  LoaderCircle,
  CheckCircle2
} from "lucide-react";

type Props = {
  value?: string;
  onUploaded: (url: string) => void;
  label?: string;
  compact?: boolean;
};

export function MediaUpload({
  value,
  onUploaded,
  label = "UPLOAD IMAGE",
  compact = false
}: Props) {

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    setError("");
    setRecent(false);

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.type)) {
      setError(
        "Choose a JPG, PNG or WebP image."
      );
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(
        "Image must be smaller than 4 MB."
      );
      return;
    }

    setBusy(true);

    try {
      const body = new FormData();

      body.append("file", file);

      const response = await fetch(
        "/api/admin/upload",
        {
          method: "POST",
          body
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      onUploaded(data.url);
      setRecent(true);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );

    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        `media-upload ${
          compact ? "media-upload-compact" : ""
        }`
      }
    >
      {value && (
        <img
          src={value}
          alt="Current image preview"
          className="media-preview"
        />
      )}

      <label className="media-file-button">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={event => {
            const file =
              event.currentTarget.files?.[0];

            void upload(file);

            event.currentTarget.value = "";
          }}
        />

        {busy ? (
          <LoaderCircle
            size={18}
            className="spin"
          />
        ) : recent ? (
          <CheckCircle2 size={18} />
        ) : (
          <ImagePlus size={18} />
        )}

        <span>
          {busy
            ? "UPLOADING..."
            : value
              ? "REPLACE IMAGE"
              : label}
        </span>
      </label>

      <small className="media-help">
        JPG, PNG or WebP · Maximum 4 MB
      </small>

      {error && (
        <p
          className="error-msg"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
