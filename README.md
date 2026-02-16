# Braille Draw

A visual editor for Unicode Braille characters. Click dots on an interactive grid to compose braille patterns and instantly get the output in multiple formats.

## Features

- **Interactive dot grid** — click to toggle, click + drag to paint, hold `Shift` to erase
- **Configurable grid size** — 1×1 up to 10×6 braille cells
- **Draw / Erase modes** — toggle between painting and erasing
- **Fill, Invert, Clear** — bulk operations on the entire grid
- **Multiple output formats:**
  - **Braille** — rendered Unicode braille characters
  - **Unicode** — codepoints (`U+2801`, `U+28FF`, etc.)
  - **ASCII** — `##` / `..` text representation
  - **Termdot** — `*` / `.` flat string for [termdot](https://github.com/obaidnadeem/termdot) input
  - **JavaScript** — copy-pasteable JS string literal
- **One-click copy** for each output format
- **Keyboard shortcuts** — `D` draw, `E` erase, `F` fill, `I` invert, `C` clear
- **Responsive** — works on desktop and mobile
- **Zero dependencies** — single HTML file, no build step

## Usage

Open `index.html` in any modern browser. No server required.

```sh
open index.html
# or
python3 -m http.server && open http://localhost:8000
```

## Braille Cell Layout

Each braille character is a 2×4 dot matrix mapped to Unicode range `U+2800`–`U+28FF`:

```
col  0    1
    ┌────┬────┐
 0  │ ●1 │ ●4 │  0x01  0x08
 1  │ ●2 │ ●5 │  0x02  0x10
 2  │ ●3 │ ●6 │  0x04  0x20
 3  │ ●7 │ ●8 │  0x40  0x80
    └────┴────┘
```

The final character is `U+2800 + bitmask` where each dot contributes its bit value.

## License

MIT
