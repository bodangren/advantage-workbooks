"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ApprovalPart } from "@/lib/lesson-package/schema";

/** Small input parts for the review page (track review_page_20261001). */

export type Approval = { status: "draft" | "approved"; date?: string };

const BOX =
  "w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/** A text area that grows with its content. */
export function TextField({
  value,
  onChange,
  className,
  lang,
  rows = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  lang?: string;
  rows?: number;
}) {
  return (
    <textarea
      lang={lang}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(BOX, "field-sizing-content resize-none", className)}
    />
  );
}

/** A one-line input. */
export function LineField({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(BOX, className)}
    />
  );
}

/**
 * A string list in one text box, split on a separator. The box keeps what Daniel types (empty lines,
 * a trailing comma); the package gets the clean list at once, so Ctrl+S saves it without a blur.
 */
function SplitField({
  value,
  onChange,
  sep,
  multiline,
  className,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  sep: string;
  multiline?: boolean;
  className?: string;
}) {
  const joined = value.join(multiline ? "\n" : ", ");
  const clean = (t: string) =>
    t
      .split(sep)
      .map((s) => s.trim())
      .filter(Boolean);
  const [text, setText] = useState(joined);
  const [seen, setSeen] = useState(joined);
  if (joined !== seen) {
    setSeen(joined);
    if (clean(text).join("\u0000") !== value.join("\u0000")) setText(joined);
  }
  const change = (t: string) => {
    setText(t);
    onChange(clean(t));
  };
  return multiline ? (
    <textarea
      value={text}
      onChange={(e) => change(e.target.value)}
      className={cn(BOX, "field-sizing-content resize-none", className)}
    />
  ) : (
    <input
      value={text}
      onChange={(e) => change(e.target.value)}
      className={cn(BOX, className)}
    />
  );
}

/** A string list edited as one line per item. */
export function LinesField(props: {
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  return <SplitField {...props} sep={"\n"} multiline />;
}

/** A string list edited as comma-separated items. */
export function ListField(props: {
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  return <SplitField {...props} sep="," />;
}

const PART_LABEL: Record<ApprovalPart, string> = {
  text: "Text",
  thai: "Thai",
  bank: "Bank",
  images: "Images",
  audio: "Audio",
  lesson: "Lesson",
};

/** A status chip for one approval part. */
export function PartChip({
  part,
  approval,
}: {
  part: ApprovalPart;
  approval?: Approval;
}) {
  const approved = approval?.status === "approved";
  return (
    <span
      title={approved ? `Approved ${approval?.date ?? ""}` : "Draft"}
      className={cn(
        "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
        approved
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800",
      )}
    >
      {approved ? "✓ " : ""}
      {PART_LABEL[part]}
    </span>
  );
}

/** A FAIL, WARN, or PASS badge. */
export function StatusBadge({ status }: { status: string }) {
  const style =
    status === "fail"
      ? "bg-red-100 text-red-800"
      : status === "warn"
        ? "bg-amber-100 text-amber-800"
        : status === "pass"
          ? "bg-green-100 text-green-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-block w-14 rounded px-1.5 py-0.5 text-center text-xs font-semibold uppercase",
        style,
      )}
    >
      {status}
    </span>
  );
}
