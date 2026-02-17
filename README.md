# Braille Draw

A visual editor for Unicode Braille patterns — with frame-by-frame animation, multi-format export, and a video-editor-style interface. Zero dependencies. Just open and draw.

## What it does

You draw on a dot grid. It gives you braille.

```
Click dots  →  ⣿⣷⣾  →  Copy  →  Paste in your CLI app
```

Six export formats, all live-updating as you draw:

| Format | Output | Use case |
|--------|--------|----------|
| **Braille** | `⣿⣷⣾` | Direct Unicode characters |
| **Unicode** | `U+28FF U+28F7` | Codepoint references |
| **ASCII** | `##..##` | Text-based visualization |
| **Termdot** | `"*..**.."` | Input for [termdot](https://github.com/obaidnadeem/termdot) |
| **JS** | `'⣿⣷⣾'` | Copy-paste into JavaScript |
| **Animation** | `const frames = [...]` | Frame arrays for animated CLI graphics |

## Animation

Create frame-by-frame braille animations right in the editor:

- Add, duplicate, delete, and reorder frames on the timeline
- Playback with adjustable FPS and loop control
- **Onion skinning** — ghost the previous frame for smooth transitions
- Export all frames as JS arrays or JSON for your CLI animation code

## Quick start

No build step. No server. No dependencies.

```sh
open index.html
```

Or with a local server:

```sh
python3 -m http.server && open http://localhost:8000
```

## Shortcuts

| Key | Action |
|-----|--------|
| `D` | Draw mode |
| `E` | Erase mode |
| `F` | Fill all dots |
| `I` | Invert grid |
| `C` | Clear grid |
| `N` | New frame |
| `Space` | Play / Pause |
| `←` `→` | Step through frames |
| `Shift+click` | Erase individual dot |

## How braille encoding works

Each braille character is a 2x4 dot matrix mapped to `U+2800`–`U+28FF`:

```
col  0    1
    ┌────┬────┐
 0  │ ●1 │ ●4 │  0x01  0x08
 1  │ ●2 │ ●5 │  0x02  0x10
 2  │ ●3 │ ●6 │  0x04  0x20
 3  │ ●7 │ ●8 │  0x40  0x80
    └────┴────┘
```

Final character = `U+2800 + bitmask`. Each dot contributes its bit value when active.

## Stack

`index.html` + `style.css` + `app.js`. That's it.

## License

MIT
