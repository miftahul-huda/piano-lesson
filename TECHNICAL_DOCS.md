# Technical Documentation: Wiseape Piano Lesson

This document provides an overview of the technical architecture, key systems, and implementation details of the Piano Lesson application.

## 1. System Architecture

The application follows a standard Client-Server architecture:
- **Frontend**: A React single-page application (SPA) built with Vite. It handles the UI, musical notation rendering, and real-time audio analysis.
- **Backend**: An Express.js server that manages user authentication, session persistence, and acts as a bridge for remote keyboard events.
- **Database**: PostgreSQL used for storing user data and practice sessions via Sequelize ORM.

## 2. Remote Keyboard Sync System

The remote keyboard feature allows a mobile device to act as an input controller for the desktop application without requiring a shared local network.

### How it works:
1. **Session Initialization**: When a user opens the "Practice" page, a unique `sessionId` is generated.
2. **QR Handshake**: The QR code encodes a URL to the `RemoteKeyboard` page on the mobile device, passing the `sessionId`.
3. **Event Pipeline**:
   - Mobile: When a key is pressed, it sends a `POST` request to `/api/remote/press` with the note name and `sessionId`.
   - Backend: Stores the last event for that session in an in-memory map.
   - Desktop: Polls the `/api/remote/poll/:sessionId` endpoint every 100ms.
4. **Input Handling**: The desktop application consumes the polled event and triggers the `handleNoteInput` logic as if a local key was pressed.

## 3. Musical Notation & Animations

We use **VexFlow 5** for rendering the Grand Staff. Since VexFlow generates static SVG/Canvas elements, implementing dynamic animations required a custom approach.

### Implementation:
- **Direct DOM Manipulation**: Instead of redrawing the entire staff on every note hit (which causes flickering), we use unique IDs (`vf-note-X`) assigned to each `StaveNote`.
- **Fading Effect**: We target the `.vf-notehead` group within the SVG and apply CSS transitions for `opacity` and `transform` directly.
- **Shatter Particles**: A separate layer of Framer Motion particles is rendered at the exact coordinates calculated via VexFlow's `getMetrics()` API.

## 4. Audio Analysis (Pitch Detection)

For users practicing on an actual piano, the app uses the browser's Microphone API.
- **Pitch Detection**: We utilize the `pitchfinder` library with the AMDF (Average Magnitude Difference Function) or Autocorrelation algorithm.
- **Noise Filtering**: We implement frequency range thresholds to ignore background noise and focus on valid piano note frequencies.

## 5. Security & Auth

- **Google OAuth**: Used for secure, passwordless authentication.
- **JWT**: JSON Web Tokens are used to authorize requests to the `/api/sessions` and `/api/user` endpoints.
- **Environment Variables**: Sensitive data like `JWT_SECRET` and `GOOGLE_CLIENT_ID` are managed via `.env` files.

---
*Documentation updated: April 2026*
