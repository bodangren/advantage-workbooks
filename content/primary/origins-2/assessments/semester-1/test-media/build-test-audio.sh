#!/bin/bash
# Semester test audio kit builder — Origins 2 (A0)
set -u
A="/home/daniebo/Desktop/Workbooks/content/primary/origins-2/assessments/semester-1/test-media/audio"
W="$A/_work"
mkdir -p "$A" "$W"
EN="English_Graceful_Lady"
TH="Thai_male_1_sample8"

say_en() { # $1 filename stem, $2 text
  [ -s "$W/$1.mp3" ] && return 0
  mmx speech synthesize --text "$2" --voice "$EN" --speed 0.9 --out "$W/$1.mp3" --quiet --output json >/dev/null || \
  mmx speech synthesize --text "$2" --voice "$EN" --speed 0.9 --out "$W/$1.mp3" --quiet --output json >/dev/null
}
say_th() {
  [ -s "$W/$1.mp3" ] && return 0
  mmx speech synthesize --text "$2" --voice "$TH" --speed 1.0 --out "$W/$1.mp3" --quiet --output json >/dev/null || \
  mmx speech synthesize --text "$2" --voice "$TH" --speed 1.0 --out "$W/$1.mp3" --quiet --output json >/dev/null
}
say_farm() { # one farm sentence
  [ -s "$W/$1.mp3" ] && return 0
  mmx speech synthesize --text "$2" --voice "$EN" --speed 0.85 --out "$W/$1.mp3" --quiet --output json >/dev/null || \
  mmx speech synthesize --text "$2" --voice "$EN" --speed 0.85 --out "$W/$1.mp3" --quiet --output json >/dev/null
}

# silence generator: sil<N>.wav in $W
mk_sil() {
  [ -s "$W/$1.wav" ] && return 0
  ffmpeg -y -v quiet -f lavfi -i anullsrc=r=32000:cl=mono -t "$2" "$W/$1.wav"
}
to_wav() { ffmpeg -y -v quiet -i "$W/$1.mp3" -ar 32000 -ac 1 "$W/$1.wav"; }
concat() { # $1 output name, then wav inputs
  local out="$1"; shift
  ffmpeg -y -v quiet $(for f in "$@"; do echo -n "-i $W/$f "; done) \
    -filter_complex "$(n=$#; s=""; for i in $(seq 0 $((n-1))); do s="$s[$i:a]"; done; echo "$s concat=n=$n:v=0:a=1[a]")" \
    -map "[a]" -b:a 128k "$A/$out"
}

### 1. Instructions per part (EN + 1.2s + TH)
mk_sil sil1 1.2; mk_sil sil2 2.0; mk_sil sil5 5.0; mk_sil sil3 3.0

say_en op "Today we have a test. This test has parts A, B, C, D, E, and F. The parts are like our workbook. Do not worry. You know this work. Write your name and class on the paper."
say_th op_th "วันนี้เรามีการสอบ ข้อสอบมีส่วน A ถึง F รูปแบบเหมือนสมุดงานที่เราเรียนมา ไม่ต้องกังวล เธอทำได้ เขียนชื่อและห้องเรียนลงในกระดาษคำตอบ"
to_wav op; to_wav op_th
concat 00-opening.mp3 op.wav sil1.wav op_th.wav

say_en pa "Part A. Look at the words. Tick the words you know. Then choose six words and write the Thai meaning."
say_th pa_th "ส่วนที่ เอ ดูคำศัพท์ทั้งสิบสองคำ ทำเครื่องหมายถูกหน้าคำที่รู้จัก แล้วเลือกหกคำ เขียนคำแปลภาษาไทย"
to_wav pa; to_wav pa_th
concat 01-part-a.mp3 pa.wav sil1.wav pa_th.wav

say_en pb_close "Part B is a listening test. Close your paper now. Put your pencil down. Eyes on me."
say_th pb_close_th "ส่วนที่ บี เป็นการฟัง ปิดเล่มคำตอบ วางดินสอ และมองที่หน้าจอ ฟังครูเล่าเรื่องให้จบสองรอบก่อน ห้ามเปิดดูข้อสอบ"
to_wav pb_close; to_wav pb_close_th
concat 02a-part-b-close.mp3 pb_close.wav sil1.wav pb_close_th.wav

say_en pb_open "Now open your paper. Do questions one to five. Circle the correct answer."
say_th pb_open_th "เปิดกระดาษคำตอบ ทำข้อหนึ่งถึงห้า วงคำตอบที่ถูกต้อง"
to_wav pb_open; to_wav pb_open_th
concat 02c-part-b-questions.mp3 pb_open.wav sil1.wav pb_open_th.wav

say_en pb2_intro "Now listen again. For each number, I read one sentence. Circle the tick or the cross."
say_th pb2_intro_th "ฟังอีกครั้ง ครูจะอ่านประโยคสำหรับแต่ละข้อ ให้วงเครื่องหมายถูกหรือผิด"
to_wav pb2_intro; to_wav pb2_intro_th
concat 02d-part-b2-intro.mp3 pb2_intro.wav sil1.wav pb2_intro_th.wav

say_en pc "Part C. Read the story quietly. Read it two times. Then answer questions nine to sixteen. Circle the answer. Then write one sentence for seventeen and eighteen."
say_th pc_th "ส่วนที่ ซี อ่านเรื่องเงียบ ๆ สองรอบ แล้วตอบข้อเก้าถึงสิบหก วงคำตอบที่ถูกต้อง จากนั้นเขียนประโยคหนึ่งประโยคสำหรับข้อสิบเจ็ดและสิบแปด"
to_wav pc; to_wav pc_th
concat 04-part-c.mp3 pc.wav sil1.wav pc_th.wav

say_en pd "Part D. Four small parts. D one: match the word and the meaning, write the letter. D two: fill the blanks with words from the word bank. D three: put the words in order. D four: finish the sentence."
say_th pd_th "ส่วนที่ ดี มีสี่ตอนย่อย ดีหนึ่ง จับคู่คำกับความหมาย เขียนตัวอักษร ดีสอง เติมคำจากกล่องคำ ดีสาม เรียงคำเป็นประโยค ดีสี่ เติมประโยคให้สมบูรณ์"
to_wav pd; to_wav pd_th
concat 05-part-d.mp3 pd.wav sil1.wav pd_th.wav

say_en pe "Part E. Number thirty-eight and thirty-nine: choose the correct word, then write the whole sentence. Capital letter. Full stop. Then write two sentences about the friends at the park."
say_th pe_th "ส่วนที่ อี ข้อสามสิบแปดและสามสิบเก้า เลือกคำที่ถูกต้องแล้วเขียนประโยคเต็ม ใช้ตัวใหญ่ต้นประโยคและจุดท้ายประโยค จากนั้นเขียนสองประโยคเกี่ยวกับเพื่อน ๆ ในสวนสาธารณะ"
to_wav pe; to_wav pe_th
concat 06-part-e.mp3 pe.wav sil1.wav pe_th.wav

say_en pf "Last part. No points. Circle one face for each line. This is for you, not for me."
say_th pf_th "ส่วนสุดท้าย ไม่มีคะแนน วงหน้าสำหรับแต่ละบรรทัด ส่วนนี้เพื่อเธอเอง"
to_wav pf; to_wav pf_th
concat 07-part-f.mp3 pf.wav sil1.wav pf_th.wav

### 2. Listening passage "Pip at the Farm" — 21 sentences, 2s pause after each, played twice with 5s gap
i=0
for s in \
  "Pip is at the farm." \
  "The farm is big." \
  "A farmer is here." \
  "The farmer is nice." \
  "This is Anna." \
  "Anna is a girl." \
  "She is with Pip." \
  "Anna sees a garden." \
  "The garden is green." \
  "Green plants are here." \
  "The farmer shows a carrot plant." \
  "The carrot is orange." \
  "The farmer gives water." \
  "The sun is hot." \
  "The plants grow big." \
  "Pip sees a dog." \
  "The dog is brown." \
  "The dog is funny." \
  "Pip likes the dog." \
  "Anna likes the farm." \
  "This is a good day."
do
  i=$((i+1))
  say_farm "farm_$(printf '%02d' $i)" "$s"
done

inputs=()
for n in $(seq -w 1 21); do
  to_wav "farm_$n"
  inputs+=(farm_$n.wav sil2.wav)
done
inputs+=(${inputs[@]})         # duplicate set for second reading
inputs+=(sil5.wav)             # not used, safety
# build: reading1 + 5s gap + reading2 (drop trailing sil2 of first pass)
set -- "${inputs[@]}"
left=()
right=()
half=$(( ${#inputs[@]} / 2 ))
for ((k=0;k<half-1;k++)); do left+=("${inputs[$k]}"); done
for ((k=half;k<${#inputs[@]}-1;k++)); do right+=("${inputs[$k]}"); done
concat 02b-part-b1-passage.mp3 "${left[@]}" sil5.wav "${right[@]}"

### 3. B2 judge sentences with 5s gaps
say_farm b2_1 "The farm is small."
say_farm b2_2 "Anna sees a garden."
say_farm b2_3 "The sun is cold."
to_wav b2_1; to_wav b2_2; to_wav b2_3
concat 02e-part-b2-items.mp3 b2_1.wav sil5.wav b2_2.wav sil5.wav b2_3.wav

echo "=== BUILT FILES ==="
for f in "$A"/*.mp3; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  printf "%-32s %6.1fs\n" "$(basename "$f")" "$d"
done
