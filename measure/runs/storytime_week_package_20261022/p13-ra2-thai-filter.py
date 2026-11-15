import re, sys
data = sys.stdin.buffer.read().decode('utf-8', errors='replace')
lines = data.split('\n')
out = '\n'.join(('<thai line removed>' if re.search('[฀-๿]', l) else l) for l in lines)
n = len(re.findall('[฀-๿]', out))
sys.stdout.write(out)
if not out.endswith('\n'):
    sys.stdout.write('\n')
sys.stderr.write('thai chars in output: %d\n' % n)
