
"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

type MediaUploadProps = {
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
}: MediaUploadProps) {
  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess(false);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG or WebP image."
      );
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(
        "Images must be smaller than 4 MB."
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/admin/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Image upload failed"
        );
      }

      if (
        typeof result.url !== "string" ||
        !result.url.startsWith("https://")
      ) {
        throw new Error(
          "The upload did not return a valid image URL."
        );
      }

      onUploaded(result.url);
      setSuccess(true);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload image"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="media-upload">
      {value && !compact && (
        <img
          src={value}
          alt="Uploaded image preview"
          className="media-preview"
          style={{
            width: "100%",
            maxWidth: 420,
            aspectRatio: "16 / 9",
            objectFit: "cover"
          }}
        />
      )}

      <label
        className="media-file-button"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "13px 18px",
          background: "#111111",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          cursor: uploading
            ? "wait"
            : "pointer"
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={uploading}
          aria-label={label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer"
          }}
        />

        <span>
          {uploading
            ? "UPLOADING IMAGE..."
            : value
              ? "REPLACE IMAGE"
              : label}
        </span>
      </label>

      <small
        style={{
          display: "block",
          marginTop: 8,
          color: "#777777"
        }}
      >
        JPG, PNG or WebP · Maximum 4 MB
      </small>

      {success && (
        <p
          role="status"
          style={{
            color: "#24734b",
            fontSize: 12
          }}
        >
          Image uploaded successfully.
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            color: "#b42318",
            fontSize: 12
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
