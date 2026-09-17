#!/bin/sh
# Cuts the site clips and stills from the two source captures in /source.
# Every cut crops the HUD column and the club badge (84% of the frame, offset 8% / 6%).
set -e
DR=source/driving-range.mp4
RS=source/range-session-ipad.mp4
CROP="crop=iw*0.81:ih*0.82:iw*0.09:ih*0.09"
CROPRS="crop=iw*0.80:ih*0.80:iw*0.10:ih*0.08"
CROP43="crop=ih*0.82*4/3:ih*0.82:(iw-ih*0.82*4/3)/2+iw*0.02:ih*0.09"
enc() { # in start dur vf out width crf
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -t "$3" -i "$1" -vf "$4,scale=$6:-2,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf "$7" -profile:v high -movflags +faststart -an "public/video/$5.mp4"
  if [ "$5" = "hero" ]; then ffmpeg -hide_banner -loglevel error -y -ss "$2" -t "$3" -i "$1" -vf "$4,scale=$6:-2,fps=30,format=yuv420p" -c:v libsvtav1 -preset 6 -crf 40 -movflags +faststart -an "public/video/$5.av1.mp4"; fi
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -i "$1" -vframes 1 -vf "$4,scale=$6:-2" "public/img/$5-poster.webp"
}
still() { # in time vf out width
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -i "$1" -vframes 1 -vf "$3,scale=$5:-2" -quality 82 "public/img/$4.webp"
}
enc $DR 66 12 "$CROP,hue=s=0" hero 1920 26
enc $RS 56 8 "$CROPRS" product-sim 1440 24
enc $DR 385 8 "$CROP43" product-range 1440 24
enc $DR 10 8 "$CROP" proof-sim 1600 25
enc $DR 482 12 "$CROP" proof-range 1600 25
still $DR 389 "$CROP" still-ring 1600
still $DR 8 "$CROP" still-aerial 1600
still $DR 471 "$CROP" still-zones 1600
still $DR 380.5 "$CROP" still-ball 1600
still $DR 482 "$CROP" still-flags 1600
still $DR 375 "$CROP" still-pins 1600
still $DR 516 "$CROP" still-purple 1600
still $DR 12 "$CROP" still-cart 1600
still $RS 74 "crop=iw:ih" still-welcome 1600
still $RS 57 "$CROPRS" still-sim 1440
echo encoded
