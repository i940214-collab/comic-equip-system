# GitHub Pages Static Assets

Put exhibition media files in this folder, then list them in `library.json`.

Example:

```json
[
  {
    "id": "opening",
    "name": "開場影片",
    "type": "video",
    "url": "assets/opening.mp4"
  },
  {
    "id": "wall",
    "name": "主視覺",
    "type": "image",
    "url": "assets/wall.jpg"
  }
]
```

Supported `type` values:

- `image`
- `video`
- `iframe`

After deploying to GitHub Pages, these paths resolve relative to the site root.
