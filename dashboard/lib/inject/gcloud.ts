/** The result of one command run (the fields of `spawnSync` that the retry reads). */
export interface RunResult {
    status: number | null;
    stdout?: string;
    stderr?: string;
    error?: Error;
    signal?: NodeJS.Signals | null;
}

/** Runs one gcloud command with its arguments and a timeout in milliseconds. */
export type Runner = (args: string[], timeoutMs: number) => RunResult;

/**
 * Runs a gcloud command again when it hangs or fails. Through the network proxy of 2026-10-06, about
 * 1 bucket request in 20 hangs for 50–90 seconds, so a short timeout and a new try cost less than one
 * long wait. Use it only for commands that are safe to repeat (a copy or an upload to a fixed path).
 * @param run Runs the command once (for example with `spawnSync('gcloud', args, { timeout })`).
 * @param args The gcloud arguments.
 * @param opts `timeoutMs` for each try; `tries` in all; `giveUp` matches a stderr after which a new try
 *   cannot help (the function then returns undefined); `onRetry` hears each failed try before the next one.
 * @returns The trimmed stdout of the run that succeeded, or undefined when `giveUp` matched.
 */
export function runWithRetry(
    run: Runner,
    args: string[],
    opts: { timeoutMs: number; tries: number; giveUp?: RegExp; onRetry?: (attempt: number, why: string) => void },
): string | undefined {
    for (let attempt = 1; ; attempt++) {
        const result = run(args, opts.timeoutMs);
        if (result.status === 0) return (result.stdout ?? '').trim();
        if (opts.giveUp?.test(result.stderr ?? '')) return undefined;
        const why = (result.stderr ?? '').trim().slice(-400) || result.error?.message || `stopped by ${result.signal ?? 'an unknown signal'}`;
        if (attempt >= opts.tries) throw new Error(`gcloud ${args.slice(0, 3).join(' ')} failed after ${attempt} tries: ${why}`);
        opts.onRetry?.(attempt, why.split('\n').pop() ?? why);
    }
}
