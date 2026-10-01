"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Cast } from "@/lib/media/cast";

/** /review/cast: Daniel picks one character sheet for each character (track lesson_media_20261001). */

const fileUrl = (file: string) =>
  `/api/files?root=sheets&path=${encodeURIComponent(file)}`;

export default function ReviewCast() {
  const [cast, setCast] = useState<Cast | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/cast")
      .then(async (r) => {
        const body = await r.json();
        if (r.ok) setCast(body);
        else setError(body.error);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const choose = async (name: string, candidate: string) => {
    setBusy(candidate);
    try {
      const r = await fetch("/api/cast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, candidate }),
      });
      const body = await r.json();
      if (r.ok) setCast(body);
      else setError(body.error);
    } finally {
      setBusy("");
    }
  };

  if (!cast)
    return (
      <p className={error ? "text-red-700" : "text-muted-foreground"}>
        {error || "Loading…"}
      </p>
    );
  const done = cast.characters.filter((c) => c.chosen).length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Character sheets</h1>
        <Link href="/review" className="text-sm text-primary underline">
          All lessons
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Click the best candidate for each character. The left picture is the
        printed source (when there is one). {done} of {cast.characters.length}{" "}
        chosen.
      </p>
      {error && <p className="text-red-700">{error}</p>}
      {cast.characters.map((c) => (
        <section key={c.name} className="space-y-2 rounded-lg border p-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold capitalize">
              {c.name.replace("-", " ")}
            </h2>
            {c.chosen ? (
              <span className="text-sm text-green-700">
                ✓ chosen {c.approved}
              </span>
            ) : (
              <span className="text-sm text-amber-700">not chosen</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{c.description}</p>
          <div className="flex flex-wrap gap-3">
            {c.source && (
              <figure className="w-48">
                {}
                <img
                  src={fileUrl(c.source.image)}
                  alt={`${c.name} source`}
                  className="h-48 w-48 rounded-md border object-contain"
                />
                <figcaption className="text-xs text-muted-foreground">
                  Source: {c.source.from}
                </figcaption>
              </figure>
            )}
            {c.candidates.map((file) => {
              const chosen = c.chosenFrom === file;
              return (
                <button
                  key={file}
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => choose(c.name, file)}
                  className={cn(
                    "w-48 rounded-md border-2 p-0.5 text-left",
                    chosen
                      ? "border-green-600"
                      : "border-transparent hover:border-primary",
                  )}
                >
                  {}
                  <img
                    src={fileUrl(file)}
                    alt={file}
                    className="h-48 w-48 object-contain"
                  />
                  <span className="text-xs text-muted-foreground">
                    {file.split("/").pop()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
