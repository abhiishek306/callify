# Callify

Callify is a WhatsApp-inspired social communication app for chatting, calling, connecting with friends, and learning languages together. It combines real-time messaging, video calling, profile onboarding, friend management, and a clean, mobile-first UI.

## Features

- Real-time chat with socket-based updates
- Video calling via Stream Video
- Friend requests and contact discovery
- Profile onboarding and profile editing
- WhatsApp-inspired home dashboard and chat layout
- Status-style cards and social feed experience
- Phone-number auth flow with OTP-style verification UI
- Optional Twilio Verify integration for production SMS OTP
- MongoDB + Express backend
- React + Vite + Tailwind frontend

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- DaisyUI
- React Router
- TanStack Query
- Socket.IO client
- Stream Chat / Stream Video SDKs

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT authentication
- Redis support for caching
- Twilio Verify for SMS OTP (optional production setup)

## Project Structure

```bash
callify/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── package.json
├── README.md
└── .gitignore
```

## Getting Started

### 1. Install dependencies

From the root:

```bash
npm install
```

This will install the root workspace dependencies and the frontend/backend packages via the project scripts.

### 2. Configure environment variables

Create a `.env` file in the `backend` directory.

Example:

```bash
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret
REDIS_URL=redis://localhost:6379

# Optional production SMS OTP setup
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

### 3. Run the app locally

```bash
npm run dev
```

This starts:
- backend on the configured port
- frontend on Vite dev server

## Production Build

From the root:

```bash
npm run build
```

This builds the frontend for production.

## Run backend only

```bash
npm run start --prefix backend
```

## Run frontend only

```bash
npm run dev --prefix frontend
```

## Optional Twilio SMS OTP

The app includes a Twilio Verify integration path for production SMS-based phone verification. If the Twilio environment variables are missing, the app falls back to a local demo OTP for development/testing.

For real production SMS delivery, add the Twilio variables listed above and use a Verify Service in your Twilio account.

## Deployment

Live demo: https://callify-ki5o.onrender.com

This project is designed to be deployable to services like Render.

Recommended setup:
- Frontend: static site deployment
- Backend: Node.js service
- MongoDB: Atlas
- Redis: managed Redis service or omit if not needed
- Environment variables: set in your deployment platform

## Notes

- The app is intentionally designed to feel like a WhatsApp-style messaging platform with a modern social feature set.
- The current OTP flow supports a development-friendly demo path and a real Twilio-ready integration path.
- The UI has been tuned for a mobile-first, app-like experience.

## License

This project is currently for educational and portfolio use.

## Author

Built as a full-stack social messaging app prototype with a WhatsApp-inspired experience.
