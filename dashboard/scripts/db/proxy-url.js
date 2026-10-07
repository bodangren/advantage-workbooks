// Reads a Postgres URL on stdin and writes it with host 127.0.0.1 and port 5433 (the Cloud SQL proxy).
// It never prints the URL; on a problem it prints only the reason and exits 1.
let s = '';
process.stdin.on('data', (d) => (s += d)).on('end', () => {
    try {
        const raw = s.trim();
        const m = raw.match(/^(postgres(?:ql)?:\/\/)([^@/]*@)?([^/?]*)(\/[^?]*)?(\?.*)?$/);
        if (!m) throw new Error('the secret is not a postgres URL');
        const [, scheme, auth = '', , path = '/primary_advantage', query = ''] = m;
        const params = new URLSearchParams(query.slice(1));
        params.delete('host');
        // Prisma-only parameters: libpq (pg_dump, psql) stops on them ("invalid URI query parameter").
        for (const p of ['pool_timeout', 'connection_limit', 'pgbouncer', 'schema', 'socket_timeout', 'statement_cache_size']) params.delete(p);
        const q = params.toString();
        process.stdout.write(`${scheme}${auth}127.0.0.1:5433${path}${q ? `?${q}` : ''}`);
    } catch (e) {
        console.error(`proxy-url: ${e.message}`);
        process.exit(1);
    }
});
