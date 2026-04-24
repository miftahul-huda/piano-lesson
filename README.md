# Wiseape Piano Lesson 🎹

An interactive, modern web application designed to help users practice piano with real-time feedback, remote connectivity, and professional musical notation.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)
![Node](https://img.shields.io/badge/Backend-Node.js-339933.svg)

## 🌟 Features

- **Interactive Grand Staff**: Real-time musical notation rendering using [VexFlow 5](https://www.vexflow.com/). Supports Treble and Bass clefs.
- **Visual Feedback**: Dynamic note-shattering effects and smooth fade-out animations for correct inputs.
- **Remote Mobile Keyboard**: Turn your smartphone into a piano controller. Scan a QR code and play remotely via the web—perfect for those without a MIDI keyboard.
- **Real Piano Integration**: Built-in pitch detection using the Web Audio API and `pitchfinder`. Practice using your actual acoustic piano!
- **Session Tracking**: Track your practice duration and scores. Integrated with Google OAuth for easy login.
- **Modern UI**: Sleek glassmorphism design with dark mode support and fluid animations powered by Framer Motion.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, VexFlow, Lucide Icons.
- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL.
- **Authentication**: Google OAuth 2.0, JWT.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/miftahul-huda/piano-lesson.git
cd piano-lesson
```

### 2. Setup Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5001
DATABASE_URL=postgres://user:password@localhost:5432/piano_lesson
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
CLIENT_URL=http://localhost:5173
```

### 3. Setup Frontend
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:5001
```

## 🏃 Running the Application

1. **Start the Backend Server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd client
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## 📱 Using the Remote Keyboard

1. In the Practice page, click **"Open Mobile Keyboard"**.
2. Scan the generated QR code with your smartphone.
3. Ensure both devices are connected to the internet.
4. Your phone is now a wireless piano controller!

## 📄 License
This project is licensed under the ISC License.

---
Developed with ❤️ by [miftahul-huda](https://github.com/miftahul-huda)
