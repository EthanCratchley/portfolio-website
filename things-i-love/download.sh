#!/bin/bash
# Download YouTube videos as MP4 into media/
cd "$(dirname "$0")/media"

URLS=(
  "https://www.youtube.com/watch?v=CGj85pVzRJs"
  "https://www.youtube.com/watch?v=lN8kTFPhQTo"
  "https://www.youtube.com/watch?v=u-pP_dCenJA"
  "https://www.youtube.com/watch?v=IJrjcHx9nDA"
  "https://www.youtube.com/watch?v=XthuZf-7A-s"
  "https://www.youtube.com/watch?v=O_X6BWJvGfo"
  "https://www.youtube.com/watch?v=vU26Pa6ERkY"
  "https://www.youtube.com/watch?v=GEPhLqwKo6g"
  "https://www.youtube.com/watch?v=ErwS24cBZPc"
  "https://www.youtube.com/watch?v=Gvf547kGOXs"
  "https://www.youtube.com/shorts/XF3nEmKziWU"
)

for url in "${URLS[@]}"; do
  echo "=== Downloading: $url ==="
  yt-dlp \
    -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
    --merge-output-format mp4 \
    -o "%(id)s.mp4" \
    "$url"
done

echo "=== Done ==="
