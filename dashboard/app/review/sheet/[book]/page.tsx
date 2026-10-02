"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type Sheet = {
  book: string;
  lessons: {
    lesson: string;
    title: string;
    imagesApproved: boolean;
    images: { position: string; caption: string; file?: string; prompt: string }[];
  }[];
};

const fileUrl = (file: string) => `/api/files?root=content&path=${encodeURIComponent(file)}`;

/** /review/sheet/:book: every picture of a book on one page, for a quick check (track level_banks_20261002). */
export default function PictureSheet({ params }: { params: Promise<{ book: string }> }) {
  const { book } = use(params);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/packages/${book}`)
      .then((r) => r.json())
      .then((s) => (s.error ? setError(s.error) : setSheet(s)))
      .catch((e) => setError(String(e)));
  }, [book]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Pictures: {book}</h1>
        <Link href="/review" className="text-sm text-primary underline">
          All lessons
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Open a lesson to choose another candidate or to ask for new pictures.
      </p>
      {error && <p className="text-red-700">{error}</p>}
      {sheet?.lessons.map((l) => (
        <section key={l.lesson} className="border-b pb-3">
          <h2 className="mb-2 font-semibold">
            <Link href={`/review/${book}/${l.lesson}`} className="text-primary hover:underline">
              {l.lesson.toUpperCase()} {l.title}
            </Link>
            {l.imagesApproved && <span className="ml-2 text-sm text-green-700">approved</span>}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {l.images.map((img) => (
              <figure key={img.position} className="text-xs">
                {img.file ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(img.file)} alt={img.caption} className="aspect-square w-full rounded object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded bg-muted p-2 text-muted-foreground">
                    not made yet
                  </div>
                )}
                <figcaption className="mt-1">{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
