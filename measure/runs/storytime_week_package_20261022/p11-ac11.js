const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = '/home/daniebo/Desktop/Workbooks';
process.chdir(ROOT);
const man = JSON.parse(fs.readFileSync('content/storytime/words/manifest.json', 'utf8'));
const by = new Map(man.items.map((r) => [r.word, r]));
const h = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// AC11-1
let t = 0, ok = 0, miss = 0;
for (let n = 1; n <= 7; n++) {
    const w = JSON.parse(fs.readFileSync('content/storytime/l2/w0' + n + '.json', 'utf8'));
    for (const b of w.books) {
        const keys = new Set();
        for (const s of [...(b.audio.sentences || []), ...(b.audio.slowSentences || [])])
            for (const x of (s.words || [])) {
                const k = x.word.normalize('NFC').replace(/[\u2018\u2019]/g, "'").toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
                if (k) keys.add(k);
            }
        const m = b.audio.wordClips || {};
        for (const k of keys) {
            t++;
            const f = m[k];
            if (!f) { miss++; continue; }
            const r = by.get(k);
            if (r && fs.existsSync('content/storytime/' + f) && h('content/storytime/' + f) === h('content/storytime/words/' + r.mp3)) ok++;
        }
    }
}
console.log('ac11_1: ' + ok + '/' + t + ' no key: ' + miss);

// AC11-2
let clips = 0;
for (let n = 1; n <= 8; n++) {
    const dir = 'content/storytime/l2/media/w0' + n + '/words';
    if (!fs.existsSync(dir)) continue;
    clips += fs.readdirSync(dir).filter((f) => /^wa-.*\.mp3$/.test(f)).length;
}
console.log('ac11_2: ' + clips);

// AC11-3
const ns = man.items.map((r) => r.n);
const gapless = ns.length === 137 && ns.every((v, i) => v === i + 1);
const added = man.items.filter((r) => r.added);
let wavOk = 0, peakOk = 0, shaOk = 0, mp3Ok = 0;
for (const r of added) {
    const wav = 'content/storytime/words/' + r.file;
    const buf = fs.readFileSync(wav);
    const ch = buf.readUInt16LE(22), rate = buf.readUInt32LE(24), bits = buf.readUInt16LE(34);
    let peak = 0;
    for (let i = 44; i + 1 < buf.length; i += 2) {
        const v = Math.abs(buf.readInt16LE(i));
        if (v > peak) peak = v;
    }
    const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels,bit_rate', '-of', 'csv=p=0', 'content/storytime/words/' + r.mp3], { encoding: 'utf8' }).trim();
    if (rate === 32000 && ch === 1 && bits === 16) wavOk++;
    if (peak === 23197) peakOk++;
    if (h(wav) === r.sha256) shaOk++;
    if (probe === '32000,1,128000') mp3Ok++;
}
console.log('ac11_3: rows ' + man.items.length + ' gapless ' + gapless + ' added rows ' + added.length + ' wav ' + wavOk + '/' + added.length + ' peak ' + peakOk + '/' + added.length + ' sha ' + shaOk + '/' + added.length + ' mp3 ' + mp3Ok + '/' + added.length);

// AC11-7
for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    const out = execFileSync('git', ['show', '--numstat', '--format=', '--', 'content/storytime/l2/w0' + n + '.json'], { encoding: 'utf8' }).trim();
    console.log('ac11_7 w0' + n + ': ' + out);
}
