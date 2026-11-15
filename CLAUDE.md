# Delegating Implementation to a Coding Agent

Some work in this project is delegated: Claude writes the prompts, runs the gates,
reads the diffs and makes the commits; a coding agent writes the code.

## Use `reasonix`

```
reasonix run --dir <REPO> --permission-mode acceptEdits -p "<task>"
```

`--permission-mode acceptEdits` is required, or policy blocks the edits. Useful extras:
`--max-steps N`, `--metrics <path>`, `--output-format json`, `--effort LEVEL`,
`--profile economy|balanced|delivery`. A warning about the missing `bwrap` sandbox
prints on every run. It is harmless.

Delegate freely with `reasonix`, including small edits. Keep the prompt and
verification rules below.

Use `opencode` only when `reasonix` is not available. Always add `--pure`, scope
`--dir` to a subtree, and run it in the background:

```
opencode run --pure --model deepseek/deepseek-v4-flash --dir <SUBTREE> --auto "<prompt>"
```

## Prompt rules

* One new file per prompt. Never batch two jobs.
* Anchor to an existing exemplar file ("read X first and match its style").
* List forbidden imports explicitly: `@aws-sdk/*`, `drizzle-orm`, `postgres`,
  `@supabase/*`, `next`, anything under `apps/` or `@/`.
* DONE-WHEN gates must be instant: `ls <path>` or `grep -c`. Never `tsc`, `vitest`,
  or any `pnpm` command.
* State exact content or exact signatures. The model implements precisely what the
  prompt says: a wrong spec gives wrong code.
* Add `Do NOT run pnpm install. Do NOT modify pnpm-lock.yaml or any package.json.`

## Verification (independent of the model)

* Never trust a self-report. Re-run every gate yourself.
* Mutation-test the suites: break the implementation on purpose and confirm that the
  tests fail.
* Verify runtime behaviour, not only `tsc`.
* Check blast radius path-scoped (`git status --porcelain <my paths>`), not repo-wide.
* `pnpm-lock.yaml` churn is not the agent's fault: any `pnpm` command rewrites it
  when other agents leave `package.json` edits uncommitted. Run
  `git checkout -- pnpm-lock.yaml` after every gate.

## Working alongside other agents

Other agents may be active in the same checkout. **Never create git worktrees.** Work
in new files under a directory nobody else has open; check `git status --porcelain
<file>` before editing anything shared. When something looks blocked, measure the
risk before you declare it.

@AGENTS.md
