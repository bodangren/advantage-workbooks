# Delegating Implementation to a Coding Agent

Some work in this project is delegated: Claude writes the prompts, runs the gates,
reads the diffs and makes the commits; a coding agent writes the code.

## Use `reasonix` (the DeepSeek-native harness), not `opencode`

```
reasonix run --dir <REPO> --permission-mode acceptEdits -p "<task>"
```

Measured on the identical task (adding one export line to an existing file):

| | opencode | reasonix |
|---|---|---|
| wall time | 5–9 min | **7 s** |
| attempts | 3 | **1** |

Roughly 50–80× faster, same model family. `--permission-mode acceptEdits` is required
or edits are blocked by policy. Useful extras: `--max-steps N`, `--metrics <path>`,
`--output-format json`, `--effort LEVEL`, `--profile economy|balanced|delivery`.
A harmless warning about the bash sandbox (`bwrap` missing) prints on every run.

Because reasonix is fast, the "don't delegate trivial edits" advice below no longer
applies to it — the retry tax that made small edits uneconomic was an opencode
problem. Keep the prompt and verification rules regardless of harness.

## opencode fallback (only if reasonix is unavailable)

```
opencode run --pure --model deepseek/deepseek-v4-flash --dir <SUBTREE> --auto "<prompt>"
```

* **`--pure` is mandatory.** Loading the plugins in `.opencode/node_modules` caused
  repeated 25-minute hangs with *zero* output. The identical prompt finished in under
  6 minutes with `--pure`. Any silent hang: re-run with `--pure` before suspecting the
  prompt or the model.
* **Scope `--dir` to a subtree** (`<repo>/packages`, `<repo>/apps`) — never the repo
  root. Root-scoped runs time out; subtree-scoped runs finish in about a minute.
  Paths still resolve from the git root, so keep writing `packages/…` / `apps/…` in
  the prompt.
* **Run in the background.** The Bash tool silently clamps `timeout` to 600000 ms, so
  foreground runs die at exactly 10 minutes regardless of what you set.
* Expect roughly **50% first-attempt success**. Budget one retry per file. Retrying an
  unchanged prompt usually works — check for a partial artifact first.

## Prompt rules

* **One new file per prompt.** Never batch two jobs (e.g. "create a test file *and*
  fix a lint warning") — that reliably hangs.
* **Anchor to an existing exemplar file** ("read X first and match its style"). This
  plus the forbidden-import list is why the model never drifted from house style.
* **List forbidden imports explicitly**: `@aws-sdk/*`, `drizzle-orm`, `postgres`,
  `@supabase/*`, `next`, anything under `apps/` or `@/`. With this stated, zero
  architecture violations occurred.
* **DONE-WHEN gates must be instant** — `ls <path>` or `grep -c`. Never `tsc`,
  `vitest`, or any `pnpm` command: the agent spends its whole budget running your gate
  and writes nothing.
* **State exact content or exact signatures.** The model implements precisely what is
  asked — a spec of `(...args: never[])` produced an uncallable type. Wrong spec in,
  wrong code out.
* Add `Do NOT run pnpm install. Do NOT modify pnpm-lock.yaml or any package.json.`

## Verification (independent of the model)

* **Never trust a self-report.** Re-run every gate yourself.
* **Mutation-test the suites**: break the implementation deliberately and confirm tests
  fail. This caught a suite passing 8/8 that was silently missing a guard.
* Verify **runtime behaviour**, not just `tsc`. Compiling proves nothing about whether
  a refinement actually rejects a URL.
* Check **blast radius path-scoped** (`git status --porcelain <my paths>`), not
  repo-wide — concurrent agents' commits make whole-repo diffs unreadable.
* `pnpm-lock.yaml` churn is **not** the agent's fault: any `pnpm` command rewrites it
  when other agents leave `package.json` edits uncommitted. Run
  `git checkout -- pnpm-lock.yaml` after every gate.

## When to delegate

With `reasonix`, delegate freely — including small edits. With `opencode`, delegation
is pure overhead on trivial edits (a one-line export took three attempts); reserve it
for substantive new files.

Model quality was never the constraint: across ~59 delegated units the model produced
zero bad artifacts and zero architecture violations. Every failure traced to harness
configuration.

## Working alongside other agents

Other agents may be active in the same checkout. **Never create git worktrees.** Work
in new files under a directory nobody else has open; check `git status --porcelain
<file>` before editing anything shared. When something looks blocked, **measure the
risk before declaring it** — five "blockers" in one session dissolved on inspection.

@AGENTS.md
