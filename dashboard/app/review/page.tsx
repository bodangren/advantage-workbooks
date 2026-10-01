"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APPROVAL_PARTS } from "@/lib/lesson-package/schema";
import { PartChip, type Approval } from "@/components/review/fields";

type LessonRow = {
  lesson: string;
  title?: string;
  number?: number;
  code?: string;
  approval?: Record<string, Approval>;
  error?: string;
  fail?: number;
  warn?: number;
};
type BookRow = { book: string; lessons: LessonRow[] };

/** /review: every lesson package with its approval chips and check counts. */
export default function ReviewList() {
  const [books, setBooks] = useState<BookRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((b) => (Array.isArray(b) ? setBooks(b) : setError(b.error)))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Review lessons</h1>
        <Link href="/review/cast" className="text-sm text-primary underline">
          Character sheets
        </Link>
      </div>
      {error && <p className="text-red-700">{error}</p>}
      {!books && !error && (
        <p className="text-muted-foreground">
          Loading and checking the packages…
        </p>
      )}
      {books?.length === 0 && <p>No packages in content/primary.</p>}
      {books?.map((b) => (
        <section key={b.book} className="space-y-2">
          <h2 className="text-lg font-semibold">{b.book}</h2>
          <table className="w-full text-sm">
            <tbody>
              {b.lessons.map((l) => (
                <tr key={l.lesson} className="border-b hover:bg-muted/50">
                  <td className="w-16 py-2 font-mono">{l.code ?? l.lesson}</td>
                  <td className="py-2">
                    <Link
                      href={`/review/${b.book}/${l.lesson}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {l.title ?? l.lesson}
                    </Link>
                    {l.error && (
                      <span className="ml-2 text-red-700">does not parse</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {APPROVAL_PARTS.map((p) => (
                        <PartChip key={p} part={p} approval={l.approval?.[p]} />
                      ))}
                    </div>
                  </td>
                  <td className="w-32 py-2 text-right">
                    {l.fail ? (
                      <span className="mr-2 font-semibold text-red-700">
                        {l.fail} FAIL
                      </span>
                    ) : null}
                    {l.warn ? (
                      <span className="text-amber-700">{l.warn} WARN</span>
                    ) : null}
                    {l.fail === 0 && l.warn === 0 && (
                      <span className="text-green-700">all pass</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
