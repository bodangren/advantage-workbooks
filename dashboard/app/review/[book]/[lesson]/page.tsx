"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  APPROVAL_PARTS,
  type ApprovalPart,
  type LessonPackage,
} from "@/lib/lesson-package/schema";
import type { PackageReport } from "@/lib/lesson-package/checks";
import { oldPictureUrl } from "@/lib/lesson-package/printed-urls";
import {
  LineField,
  LinesField,
  ListField,
  PartChip,
  StatusBadge,
  TextField,
} from "@/components/review/fields";

/**
 * /review/[book]/[lesson]: edit and approve one lesson package (track review_page_20261001).
 * Ctrl+S saves. Ctrl+Enter approves the part in focus. J and K go to the next and the previous lesson.
 */

type Edit = (fn: (draft: LessonPackage) => void) => void;
type Message = { kind: "ok" | "error"; text: string } | null;

const PRINT_MCQ = 4;
const fileUrl = (root: "content" | "sheets", file: string) =>
  `/api/files?root=${root}&path=${encodeURIComponent(file)}`;

export default function ReviewLesson() {
  const { book, lesson } = useParams<{ book: string; lesson: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<LessonPackage | null>(null);
  const [report, setReport] = useState<PackageReport | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [current, setCurrent] = useState<ApprovalPart>("text");
  const [order, setOrder] = useState<string[]>([]);
  const api = `/api/packages/${book}/${lesson}`;

  useEffect(() => {
    let live = true;
    fetch(api)
      .then(async (r) => {
        const body = await r.json();
        if (!live) return;
        if (!r.ok) return setMessage({ kind: "error", text: body.error });
        setPkg(body.package);
        setReport(body.report);
        setDirty(false);
      })
      .catch((e) => live && setMessage({ kind: "error", text: String(e) }));
    fetch("/api/packages")
      .then((r) => r.json())
      .then(
        (books) =>
          live &&
          Array.isArray(books) &&
          setOrder(
            books
              .find((b: { book: string }) => b.book === book)
              ?.lessons.map((l: { lesson: string }) => l.lesson) ?? [],
          ),
      );
    return () => {
      live = false;
    };
  }, [api, book]);

  const edit: Edit = useCallback((fn) => {
    setPkg((p) => {
      if (!p) return p;
      const next = structuredClone(p);
      fn(next);
      return next;
    });
    setDirty(true);
  }, []);

  const save = async (): Promise<boolean> => {
    if (!pkg || !dirty) return true;
    setBusy(true);
    try {
      const r = await fetch(api, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pkg),
      });
      const body = await r.json();
      if (body.report) setReport(body.report);
      if (!r.ok) {
        setMessage({
          kind: "error",
          text:
            body.error ?? "Not saved: the package does not parse. See Checks.",
        });
        return false;
      }
      setPkg(body.package);
      setDirty(false);
      setMessage({ kind: "ok", text: "Saved" });
      return true;
    } finally {
      setBusy(false);
    }
  };

  const approve = async (part: ApprovalPart = current) => {
    if (!(await save())) return;
    setBusy(true);
    try {
      const r = await fetch(`${api}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ part }),
      });
      const body = await r.json();
      if (!r.ok) return setMessage({ kind: "error", text: body.error });
      setPkg(body.package);
      setMessage({ kind: "ok", text: `${part} approved` });
    } finally {
      setBusy(false);
    }
  };

  const choosePicture = async (position: string, candidate: string) => {
    if (!(await save())) return;
    setBusy(true);
    try {
      const r = await fetch(`${api}/image`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position, candidate }),
      });
      const body = await r.json();
      if (!r.ok) return setMessage({ kind: "error", text: body.error });
      setPkg(body.package);
      setReport(body.report);
      setMessage({ kind: "ok", text: `${position}: picture changed` });
    } finally {
      setBusy(false);
    }
  };

  const go = async (delta: number) => {
    const target = order[order.indexOf(lesson) + delta];
    if (!target || !(await save())) return;
    router.push(`/review/${book}/${target}`);
  };

  const actions = useRef({ save, approve, go });
  useEffect(() => {
    actions.current = { save, approve, go };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        actions.current.save();
      } else if (mod && e.key === "Enter") {
        e.preventDefault();
        actions.current.approve();
      } else if (!mod && !e.altKey && (e.key === "j" || e.key === "k")) {
        if (
          (e.target as HTMLElement).closest(
            "input, textarea, select, [contenteditable]",
          )
        )
          return;
        actions.current.go(e.key === "j" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!pkg)
    return (
      <p
        className={
          message?.kind === "error" ? "text-red-700" : "text-muted-foreground"
        }
      >
        {message?.text ?? "Loading…"}
      </p>
    );

  const section = (part: ApprovalPart) => ({
    part,
    pkg,
    current,
    setCurrent,
    onApprove: () => approve(part),
    busy,
  });
  const index = order.indexOf(lesson);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <header className="sticky top-0 z-10 -mx-6 space-y-2 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/review" className="text-sm text-primary underline">
            All lessons
          </Link>
          <span className="font-mono text-sm text-muted-foreground">
            {book} / {pkg.meta.lesson}
          </span>
          <h1 className="flex-1 truncate text-xl font-bold">
            {pkg.meta.title}
          </h1>
          <Button
            size="sm"
            variant="outline"
            disabled={index <= 0}
            onClick={() => go(-1)}
            title="K"
          >
            ← Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={index < 0 || index >= order.length - 1}
            onClick={() => go(1)}
            title="J"
          >
            Next →
          </Button>
          <Button
            size="sm"
            disabled={!dirty || busy}
            onClick={save}
            title="Ctrl+S"
          >
            {dirty ? "Save ●" : "Saved"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {APPROVAL_PARTS.map((p) => (
            <PartChip key={p} part={p} approval={pkg.approval[p]} />
          ))}
          <Button
            size="xs"
            className="ml-2"
            disabled={
              busy ||
              APPROVAL_PARTS.some(
                (p) => p !== "lesson" && pkg.approval[p].status !== "approved",
              )
            }
            onClick={() => approve("lesson")}
          >
            Approve lesson
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Ctrl+S save · Ctrl+Enter approve the part in focus ({current}) · J/K
            next/prev
          </span>
        </div>
        {message && (
          <p
            className={cn(
              "text-sm",
              message.kind === "error" ? "text-red-700" : "text-green-700",
            )}
          >
            {message.text}
          </p>
        )}
      </header>

      <Checks report={report} />
      <Section title="Article" {...section("text")}>
        <ArticleEditor pkg={pkg} edit={edit} report={report} />
      </Section>
      <Section title="Glossary and Thai" {...section("thai")}>
        <GlossaryEditor pkg={pkg} edit={edit} />
        <ThaiEditor pkg={pkg} edit={edit} />
      </Section>
      <Section title="Question bank and activities" {...section("bank")}>
        <BankEditor pkg={pkg} edit={edit} />
        <ActivitiesEditor pkg={pkg} edit={edit} />
      </Section>
      <Section title="Images" {...section("images")}>
        <ImagesEditor
          pkg={pkg}
          edit={edit}
          choose={choosePicture}
          busy={busy}
        />
      </Section>
      <Section title="Audio" {...section("audio")}>
        <AudioPlayer pkg={pkg} />
      </Section>
    </div>
  );
}

function Section(props: {
  title: string;
  part: ApprovalPart;
  pkg: LessonPackage;
  current: ApprovalPart;
  setCurrent: (p: ApprovalPart) => void;
  onApprove: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  const approval = props.pkg.approval[props.part];
  return (
    <section
      onFocusCapture={() => props.setCurrent(props.part)}
      onMouseDown={() => props.setCurrent(props.part)}
      className={cn(
        "space-y-4 rounded-lg border p-4",
        props.current === props.part && "border-primary ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{props.title}</h2>
        <PartChip part={props.part} approval={approval} />
        <Button
          size="sm"
          variant={approval.status === "approved" ? "outline" : "default"}
          className="ml-auto"
          disabled={props.busy}
          onClick={props.onApprove}
        >
          {approval.status === "approved" ? "Approve again" : "Approve"}
        </Button>
      </div>
      {props.children}
    </section>
  );
}

function Checks({ report }: { report: PackageReport | null }) {
  if (!report) return null;
  const open = report.checks.filter((c) => c.status !== "pass");
  const passed = report.checks.filter((c) => c.status === "pass");
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Checks</h2>
      {open.length === 0 && (
        <p className="text-sm text-green-700">
          All {passed.length} checks pass.
        </p>
      )}
      {open.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <StatusBadge status={c.status} />
          <span className="font-medium">{c.label}</span>
          {c.detail && (
            <span className="whitespace-pre-wrap text-muted-foreground">
              {c.detail}
            </span>
          )}
        </div>
      ))}
      {open.length > 0 && passed.length > 0 && (
        <details className="text-sm text-muted-foreground">
          <summary>{passed.length} checks pass</summary>
          {passed.map((c) => (
            <div key={c.id}>{c.label}</div>
          ))}
        </details>
      )}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function ArticleEditor({
  pkg,
  edit,
  report,
}: {
  pkg: LessonPackage;
  edit: Edit;
  report: PackageReport | null;
}) {
  const text = report?.text;
  const printed = pkg.meta.printed;
  return (
    <div className="space-y-3">
      {printed && (
        <p className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
          Printed lesson ({printed.file.split("/").slice(-2).join("/")}): the
          article, the vocabulary words, and the printed questions and
          activities are locked. Everything else is for the app.
        </p>
      )}
      <div>
        <Label>Title</Label>
        <LineField
          value={pkg.meta.title}
          onChange={(v) => edit((d) => void (d.meta.title = v))}
        />
      </div>
      {pkg.text.paragraphs.map((p, i) => (
        <div key={i}>
          <Label>Paragraph {i + 1}</Label>
          <TextField
            value={p}
            readOnly={!!printed}
            onChange={(v) => edit((d) => void (d.text.paragraphs[i] = v))}
            className="text-base leading-relaxed"
          />
        </div>
      ))}
      <div>
        <Label>Summary</Label>
        <TextField
          value={pkg.text.summary}
          onChange={(v) => edit((d) => void (d.text.summary = v))}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Glossed words</Label>
          <ListField
            value={pkg.text.glossed}
            onChange={(v) => edit((d) => void (d.text.glossed = v))}
          />
        </div>
        <div>
          <Label>Names</Label>
          <ListField
            value={pkg.text.names}
            onChange={(v) => edit((d) => void (d.text.names = v))}
          />
        </div>
        <div>
          <Label>Recycled words</Label>
          <ListField
            value={pkg.text.recycle}
            onChange={(v) => edit((d) => void (d.text.recycle = v))}
          />
        </div>
        <div>
          <Label>Allowed words</Label>
          <ListField
            value={pkg.text.allow}
            onChange={(v) => edit((d) => void (d.text.allow = v))}
          />
        </div>
      </div>
      {text && (
        <div className="space-y-1 rounded-md bg-muted/40 p-3 text-sm">
          <div>
            {text.stats.words} words · {text.stats.sentences} sentences · mean{" "}
            {text.stats.meanSentenceLength.toFixed(1)} · longest{" "}
            {text.stats.longestSentence} · Starters{" "}
            {(text.stats.startersShare * 100).toFixed(0)}%
          </div>
          {text.nonStarters.length > 0 && (
            <div>
              Above Starters:{" "}
              {text.nonStarters.map((w) => (
                <span key={w.word} className="mr-2">
                  <b>{w.word}</b>{" "}
                  <span className="text-muted-foreground">({w.level})</span>
                </span>
              ))}
            </div>
          )}
          <div>New Starters words: {text.newWords.join(", ") || "none"}</div>
          <div>Recycled: {text.recycled.join(", ") || "none"}</div>
          <div className="text-muted-foreground">
            Saved text only. Save (Ctrl+S) to check an edit.
          </div>
        </div>
      )}
    </div>
  );
}

function GlossaryEditor({ pkg, edit }: { pkg: LessonPackage; edit: Edit }) {
  return (
    <div>
      <Label>Glossary ({pkg.glossary.length})</Label>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="w-28">Word</th>
            <th className="w-24">POS</th>
            <th>Definition</th>
            <th className="w-40">Thai</th>
            <th>Example from the text</th>
          </tr>
        </thead>
        <tbody>
          {pkg.glossary.map((g, i) => (
            <tr key={i} className="align-top">
              <td className="p-0.5">
                <LineField
                  value={g.word}
                  readOnly={!!pkg.meta.printed}
                  onChange={(v) => edit((d) => void (d.glossary[i].word = v))}
                />
              </td>
              <td className="p-0.5">
                <LineField
                  value={g.pos}
                  onChange={(v) => edit((d) => void (d.glossary[i].pos = v))}
                />
              </td>
              <td className="p-0.5">
                <TextField
                  value={g.definition}
                  onChange={(v) =>
                    edit((d) => void (d.glossary[i].definition = v))
                  }
                />
              </td>
              <td className="p-0.5">
                <TextField
                  lang="th"
                  value={g.thai}
                  onChange={(v) => edit((d) => void (d.glossary[i].thai = v))}
                />
              </td>
              <td className="p-0.5">
                <TextField
                  value={g.example}
                  onChange={(v) =>
                    edit((d) => void (d.glossary[i].example = v))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThaiEditor({ pkg, edit }: { pkg: LessonPackage; edit: Edit }) {
  return (
    <div className="space-y-3">
      {pkg.thai.paragraphs.map((para, i) => (
        <div key={i}>
          <Label>Thai, paragraph {i + 1}</Label>
          {para.map((s, j) => (
            <div key={j} className="grid grid-cols-2 gap-2 py-0.5 text-sm">
              <div className="pt-1">{s.en}</div>
              <TextField
                lang="th"
                value={s.th}
                onChange={(v) =>
                  edit((d) => void (d.thai.paragraphs[i][j].th = v))
                }
              />
            </div>
          ))}
        </div>
      ))}
      <div>
        <Label>Thai summary</Label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="pt-1">{pkg.text.summary}</div>
          <TextField
            lang="th"
            value={pkg.thai.summary}
            onChange={(v) => edit((d) => void (d.thai.summary = v))}
          />
        </div>
      </div>
    </div>
  );
}

function PrintStar({
  on,
  onClick,
  title,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={disabled ? "The printed set is locked" : title}
      disabled={disabled}
      className="mt-1 shrink-0 self-start disabled:cursor-default"
    >
      <Star
        className={cn(
          "h-5 w-5",
          on ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
        )}
      />
    </button>
  );
}

function BankEditor({ pkg, edit }: { pkg: LessonPackage; edit: Edit }) {
  const printMcq = new Set(pkg.print.mcq);
  // A printed lesson: the printed questions, their printed options, and the answers are locked.
  const printed = !!pkg.meta.printed;
  const lockedMcq = (id: string) => printed && printMcq.has(id);
  const toggleMcq = (id: string) =>
    edit((d) => {
      const set = new Set(d.print.mcq);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      d.print.mcq = d.bank.mcq.map((q) => q.id).filter((x) => set.has(x));
    });
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "text-sm font-medium",
          pkg.print.mcq.length === PRINT_MCQ && pkg.print.saq
            ? "text-green-700"
            : "text-amber-700",
        )}
      >
        Print set: {pkg.print.mcq.length}/{PRINT_MCQ} MCQ +{" "}
        {pkg.print.saq ? 1 : 0}/1 SAQ. A star marks a printed question.
      </div>
      <div>
        <Label>Multiple choice ({pkg.bank.mcq.length})</Label>
        <div className="space-y-3">
          {pkg.bank.mcq.map((q, i) => (
            <div key={q.id} className="flex gap-2 rounded-md border p-2">
              <PrintStar
                on={printMcq.has(q.id)}
                onClick={() => toggleMcq(q.id)}
                title="Print this question"
                disabled={printed}
              />
              <div className="flex-1 space-y-1">
                <div className="flex gap-2">
                  <span className="pt-1 font-mono text-xs text-muted-foreground">
                    {q.id}
                  </span>
                  <LineField
                    value={q.question}
                    readOnly={lockedMcq(q.id)}
                    onChange={(v) =>
                      edit((d) => void (d.bank.mcq[i].question = v))
                    }
                    className="font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 pl-8">
                  {q.options.map((o, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`answer-${q.id}`}
                        checked={o === q.answer}
                        disabled={lockedMcq(q.id)}
                        onChange={() =>
                          edit(
                            (d) =>
                              void (d.bank.mcq[i].answer =
                                d.bank.mcq[i].options[k]),
                          )
                        }
                        title="Correct answer"
                      />
                      <LineField
                        value={o}
                        readOnly={lockedMcq(q.id) && k < pkg.print.mcqOptions}
                        onChange={(v) =>
                          edit((d) => {
                            const m = d.bank.mcq[i];
                            if (m.answer === m.options[k]) m.answer = v;
                            m.options[k] = v;
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pl-8 text-sm">
                  <span className="w-20 pt-1 text-xs text-muted-foreground">
                    Evidence
                  </span>
                  <TextField
                    value={q.evidence}
                    onChange={(v) =>
                      edit((d) => void (d.bank.mcq[i].evidence = v))
                    }
                  />
                </div>
                <div className="flex gap-2 pl-8 text-sm">
                  <span className="w-20 pt-1 text-xs text-muted-foreground">
                    Objectives
                  </span>
                  <ListField
                    value={q.objectives}
                    onChange={(v) =>
                      edit((d) => void (d.bank.mcq[i].objectives = v))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Short answer ({pkg.bank.saq.length})</Label>
        <div className="space-y-2">
          {pkg.bank.saq.map((q, i) => (
            <div key={q.id} className="flex gap-2 rounded-md border p-2">
              <PrintStar
                on={pkg.print.saq === q.id}
                onClick={() => edit((d) => void (d.print.saq = q.id))}
                title="Print this question"
                disabled={printed}
              />
              <div className="grid flex-1 grid-cols-[3rem_1fr] gap-1 text-sm">
                <span className="pt-1 font-mono text-xs text-muted-foreground">
                  {q.id}
                </span>
                <LineField
                  value={q.question}
                  readOnly={printed && pkg.print.saq === q.id}
                  onChange={(v) =>
                    edit((d) => void (d.bank.saq[i].question = v))
                  }
                  className="font-medium"
                />
                <span className="pt-1 text-xs text-muted-foreground">
                  Answer
                </span>
                <LineField
                  value={q.answer}
                  onChange={(v) => edit((d) => void (d.bank.saq[i].answer = v))}
                />
                <span className="pt-1 text-xs text-muted-foreground">Obj.</span>
                <ListField
                  value={q.objectives}
                  onChange={(v) =>
                    edit((d) => void (d.bank.saq[i].objectives = v))
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">
            Printed answer hint
          </span>
          <LineField
            value={pkg.print.saqHint ?? ""}
            onChange={(v) =>
              edit((d) => void (d.print.saqHint = v || undefined))
            }
            className="max-w-sm"
          />
        </div>
      </div>
      <div>
        <Label>Long answer ({pkg.bank.laq.length})</Label>
        <div className="space-y-1">
          {pkg.bank.laq.map((q, i) => (
            <div
              key={q.id}
              className="grid grid-cols-[3rem_1fr_12rem] gap-2 text-sm"
            >
              <span className="pt-1 font-mono text-xs text-muted-foreground">
                {q.id}
              </span>
              <TextField
                value={q.question}
                onChange={(v) => edit((d) => void (d.bank.laq[i].question = v))}
              />
              <ListField
                value={q.objectives}
                onChange={(v) =>
                  edit((d) => void (d.bank.laq[i].objectives = v))
                }
              />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Target objectives</Label>
          <ListField
            value={pkg.tags.targetObjectives}
            onChange={(v) => edit((d) => void (d.tags.targetObjectives = v))}
          />
        </div>
        <div>
          <Label>Supporting objectives</Label>
          <ListField
            value={pkg.tags.supportingObjectives}
            onChange={(v) =>
              edit((d) => void (d.tags.supportingObjectives = v))
            }
          />
        </div>
      </div>
    </div>
  );
}

function ActivitiesEditor({ pkg, edit }: { pkg: LessonPackage; edit: Edit }) {
  const a = pkg.activities;
  const locked = !!pkg.meta.printed;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label>Sentence starters (one per line)</Label>
        <LinesField
          value={a.sentenceStarters}
          readOnly={locked}
          onChange={(v) =>
            edit((d) => void (d.activities.sentenceStarters = v))
          }
        />
      </div>
      <div>
        <Label>
          Sentence order (full sentences; the builder scrambles them)
        </Label>
        <LinesField
          value={a.sentenceOrder}
          readOnly={locked}
          onChange={(v) => edit((d) => void (d.activities.sentenceOrder = v))}
        />
      </div>
      <div className="md:col-span-2">
        <Label>Vocabulary fill (___ marks the gap)</Label>
        {a.vocabFill.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_10rem] gap-2 py-0.5">
            <LineField
              value={f.sentence}
              readOnly={locked}
              onChange={(v) =>
                edit((d) => void (d.activities.vocabFill[i].sentence = v))
              }
            />
            <LineField
              value={f.answer}
              readOnly={locked}
              onChange={(v) =>
                edit((d) => void (d.activities.vocabFill[i].answer = v))
              }
            />
          </div>
        ))}
      </div>
      <div>
        <Label>Sentence completion (one per line)</Label>
        <LinesField
          value={a.sentenceCompletion}
          readOnly={locked}
          onChange={(v) =>
            edit((d) => void (d.activities.sentenceCompletion = v))
          }
        />
      </div>
      <div>
        <Label>Writing prompt</Label>
        <TextField
          value={a.writingPrompt}
          readOnly={locked}
          onChange={(v) => edit((d) => void (d.activities.writingPrompt = v))}
        />
        <Label>Writing frames (one per line)</Label>
        <LinesField
          value={a.writingFrames}
          onChange={(v) => edit((d) => void (d.activities.writingFrames = v))}
        />
      </div>
    </div>
  );
}

/** The picture the app shows today (printed lessons); hidden when the bucket has none. */
function OldPicture({ url }: { url: string }) {
  const [missing, setMissing] = useState(false);
  if (missing)
    return (
      <p className="text-xs text-muted-foreground">
        No picture in the app today.
      </p>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-xs text-muted-foreground"
      title="Open the old picture"
    >
      <img
        src={url}
        alt="In the app today"
        onError={() => setMissing(true)}
        className="h-24 w-24 rounded border object-cover"
      />
      In the app today
    </a>
  );
}

function ImagesEditor({
  pkg,
  edit,
  choose,
  busy,
}: {
  pkg: LessonPackage;
  edit: Edit;
  choose: (position: string, candidate: string) => void;
  busy: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {pkg.images.map((img, i) => (
        <div key={i} className="space-y-2">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted/40">
            {img.file ? (
              <img
                src={`${fileUrl("content", img.file)}&v=${encodeURIComponent(img.chosenFrom ?? "")}`}
                alt={img.caption}
                className="h-full w-full object-contain"
              />
            ) : pkg.meta.printed ? (
              <>
                <img
                  src={oldPictureUrl(pkg.meta.printed, i)}
                  alt="In the app today"
                  className="h-full w-full object-contain opacity-80"
                />
                <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">
                  In the app today (no new picture yet)
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                No image yet
              </span>
            )}
          </div>
          {pkg.meta.printed && img.file && (
            <OldPicture url={oldPictureUrl(pkg.meta.printed, i)} />
          )}
          {img.candidates.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {img.candidates.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy}
                  title={`Use ${c.split("/").pop()}`}
                  onClick={() => choose(img.position, c)}
                  className={cn(
                    "rounded border-2 p-0.5",
                    c === img.chosenFrom
                      ? "border-green-600"
                      : "border-transparent hover:border-primary",
                  )}
                >
                  <img
                    src={fileUrl("content", c)}
                    alt={c}
                    className="h-14 w-14 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {img.position}
            </span>
            <Button
              size="xs"
              variant={img.redo ? "default" : "outline"}
              className="ml-auto"
              onClick={() =>
                edit(
                  (d) =>
                    void (d.images[i].redo = !d.images[i].redo || undefined),
                )
              }
              title="Ask Claude for new pictures for this position (then save)"
            >
              {img.redo ? "New pictures asked" : "Ask for new pictures"}
            </Button>
          </div>
          <Label>Prompt</Label>
          <TextField
            value={img.prompt}
            onChange={(v) => edit((d) => void (d.images[i].prompt = v))}
            className="text-xs"
          />
          <Label>Characters</Label>
          <ListField
            value={img.characters}
            onChange={(v) => edit((d) => void (d.images[i].characters = v))}
          />
          <Label>Caption</Label>
          <LineField
            value={img.caption}
            onChange={(v) => edit((d) => void (d.images[i].caption = v))}
          />
          <Label>Text on the image (one per line)</Label>
          <LinesField
            value={img.overlay.map((o) => o.text)}
            onChange={(v) =>
              edit(
                (d) =>
                  void (d.images[i].overlay = v.map((text, k) => ({
                    ...d.images[i].overlay[k],
                    text,
                  }))),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

function AudioPlayer({ pkg }: { pkg: LessonPackage }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  if (!pkg.audio.article)
    return <p className="text-sm text-muted-foreground">No audio yet.</p>;
  return (
    <div className="space-y-2">
      <audio
        ref={ref}
        controls
        src={fileUrl("content", pkg.audio.article)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        className="w-full"
      />
      <div className="space-y-0.5 text-sm">
        {pkg.audio.sentences.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (ref.current) ref.current.currentTime = s.startTime;
            }}
            className={cn(
              "block w-full rounded px-1 text-left",
              time >= s.startTime && time < s.endTime && "bg-amber-100",
            )}
          >
            <span className="mr-2 font-mono text-xs text-muted-foreground">
              {s.startTime.toFixed(1)}
            </span>
            {s.text}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Voice: {pkg.audio.voice ?? "not set"}
      </p>
    </div>
  );
}
