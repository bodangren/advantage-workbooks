import fs from 'node:fs';
import { createHash, hash as oneShot } from 'node:crypto';

const file = '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures/l2-w01-check-row-cup-v1.png';
const size = fs.statSync(file).size;
const buf = fs.readFileSync(file);

let t = Date.now();
for (let i = 0; i < 5; i++) createHash('sha256').update(buf).digest('hex');
const streamMs = (Date.now() - t) / 5;

t = Date.now();
for (let i = 0; i < 5; i++) oneShot('sha256', buf, 'hex');
const oneShotMs = (Date.now() - t) / 5;

t = Date.now();
for (let i = 0; i < 5; i++) fs.readFileSync(file);
const readMs = (Date.now() - t) / 5;

const chunk = Buffer.alloc(1 << 20);
t = Date.now();
for (let i = 0; i < 5; i++) {
    const h = createHash('sha256');
    const fd = fs.openSync(file, 'r');
    let read = 0;
    for (;;) {
        const n = fs.readSync(fd, chunk, 0, chunk.length, null);
        if (n <= 0) break;
        read += n;
        h.update(chunk.subarray(0, n));
    }
    fs.closeSync(fd);
    h.digest('hex');
}
const chunkedMs = (Date.now() - t) / 5;

console.log(`file size MB: ${(size / 1e6).toFixed(1)}`);
console.log(`createHash ms: ${streamMs.toFixed(1)} -> ${(size / 1e6 / (streamMs / 1000)).toFixed(0)} MB/s`);
console.log(`oneShot ms: ${oneShotMs.toFixed(1)} -> ${(size / 1e6 / (oneShotMs / 1000)).toFixed(0)} MB/s`);
console.log(`readFileSync ms: ${readMs.toFixed(1)}`);
console.log(`chunked read+hash ms: ${chunkedMs.toFixed(1)} -> ${(size / 1e6 / (chunkedMs / 1000)).toFixed(0)} MB/s`);
