import { describe, expect, it } from 'vitest';
import { runWithRetry, type RunResult } from '../lib/inject/gcloud';

const ok = (stdout = 'done'): RunResult => ({ status: 0, stdout, stderr: '' });
const hung: RunResult = { status: null, stdout: '', stderr: '', signal: 'SIGTERM' };
const failed = (stderr: string): RunResult => ({ status: 1, stdout: '', stderr });

/** A runner that returns the given results in order and records each call. */
function script(results: RunResult[]) {
    const calls: { args: string[]; timeoutMs: number }[] = [];
    const run = (args: string[], timeoutMs: number) => {
        calls.push({ args, timeoutMs });
        return results[Math.min(calls.length - 1, results.length - 1)];
    };
    return { run, calls };
}

describe('runWithRetry', () => {
    it('returns the output of the first run that succeeds', () => {
        const { run, calls } = script([ok('first')]);
        expect(runWithRetry(run, ['storage', 'ls'], { timeoutMs: 60_000, tries: 3 })).toBe('first');
        expect(calls).toEqual([{ args: ['storage', 'ls'], timeoutMs: 60_000 }]);
    });

    it('runs a hung command again with the same arguments and timeout', () => {
        const retries: string[] = [];
        const { run, calls } = script([hung, hung, ok('third')]);
        const out = runWithRetry(run, ['storage', 'cp', 'a', 'b'], { timeoutMs: 45_000, tries: 4, onRetry: (attempt, why) => retries.push(`${attempt}: ${why}`) });
        expect(out).toBe('third');
        expect(calls).toHaveLength(3);
        expect(calls.every((c) => c.timeoutMs === 45_000 && c.args.join(' ') === 'storage cp a b')).toBe(true);
        expect(retries).toEqual(['1: stopped by SIGTERM', '2: stopped by SIGTERM']);
    });

    it('throws after the last try with the cause of the last failure', () => {
        const { run, calls } = script([hung, failed('ERROR: 503 Service Unavailable')]);
        expect(() => runWithRetry(run, ['storage', 'cp', 'a', 'b'], { timeoutMs: 1_000, tries: 2 })).toThrow(/storage cp a failed after 2 tries: ERROR: 503 Service Unavailable/);
        expect(calls).toHaveLength(2);
    });

    it('returns undefined without a retry when the stderr shows that retrying cannot help', () => {
        const { run, calls } = script([failed('ERROR: No URLs matched: gs://bucket/x.png')]);
        expect(runWithRetry(run, ['storage', 'cp', 'gs://bucket/x.png', 'gs://bucket/backup/x.png'], { timeoutMs: 1_000, tries: 5, giveUp: /No URLs matched/ })).toBeUndefined();
        expect(calls).toHaveLength(1);
    });
});
