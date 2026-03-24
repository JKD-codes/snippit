<h1 align="center">
  <img src="logo.png" alt="Snippit 95" width="100"/>
  <br>
  ✂️ Snippit 95
</h1>

<p align="center">
  <b>A fully functional, nostalgic URL shortener built with an authentic Windows 95 aesthetic.</b>
</p>

---

## 💾 Features

- **Iconic Win95 Aesthetic:** Beveled windows, rigid gray toolbars, classic taskbar, MS Sans Serif fonts, and zero rounded corners.
- **Boot Splash Animation:** Experience the slow, blocky startup progress bar before loading the "desktop".
- **URL Shortening:** Paste a long link and generate a randomized shorthand link instantly.
- **Custom Aliases:** Choose exactly what you want your short link to be called (e.g., `snippit.io/my-link`).
- **QR Code Generator:** View and download customized QR codes for any snipped link in a retro dialog window.
- **Click Tracking:** A built-in "Snipped Links" dashboard tracking how many times your links are clicked.
- **Local Persistence:** Everything is saved locally in your browser's `localStorage` — no database required.
- **Web Audio FX:** Satisfying 8-bit, square-wave sound "blips" on every button click.

## 🛠️ Technology Stack

- **HTML5:** Semantic structure, completely separated.
- **CSS3 (Vanilla):** CSS custom properties, grid/flexbox, and manual inset/outset borders to forge the retro 3D interface. No CSS frameworks used.
- **Vanilla JavaScript:** Event listeners, `localStorage` APIs, hash-based URL routing, and the Web Audio API for sound generation.
- **QRCode.js:** A lightweight library used solely for generating the dynamic QR code SVGs.

## 🚀 How to Run Locally

Because the project relies purely on vanilla web technologies, running it is incredibly simple.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JKD-codes/snippit.git
   cd snippit
   ```

2. **Serve the project:**
   You can serve the `index.html` file using any local web server. For example, if you have Node.js installed:
   ```bash
   npx serve .
   ```
   *Alternatively, you can just open `index.html` directly in your browser or use the "Live Server" extension in VS Code.*

3. **Enjoy the nostalgia!**

## 🎨 Design Philosophy

Snippit was built primarily as a fun design exercise in recreating historical UI patterns using modern CSS. It intentionally avoids `border-radius`, CSS transitions, and smooth drop-shadows in favor of hard pixels, inset box-shadows, and strict layouts.

## 📱 Responsiveness
While Windows 95 was built for 800x600 CRT monitors, Snippit is built for the modern web. The desktop experience gracefully falls back to a full-screen, stacked application view for mobile users, removing heavy desktop paradigms but keeping the core visuals and functionality exactly the same. 

<br>

---
<p align="center">
  <i>"It's now safe to turn off your computer."</i>
</p>
