# Architecture Overview

## Call flow

1. A user signs in or completes onboarding and receives a JWT from the backend.
2. The frontend connects to the real-time Socket.io server and joins a room or channel.
3. Presence updates and chat messages are emitted through the signaling layer.
4. Video calls are initiated from the client and configured through the Stream Video integration.
5. The backend validates requests, enforces auth and rate limits, and persists user/chat metadata in MongoDB.
6. Redis is used for lightweight caching and future shared session-state support.
7. If the socket reconnects or a user rejoins, the app re-establishes room membership and resumes the session without duplicating state.

## System components

- Frontend: React + Vite app for chat, onboarding, social UI, and call initiation
- Backend: Express server for auth, APIs, validation, and Socket.io signaling
- Database: MongoDB for user profiles and social data
- Cache: Redis for lightweight session and data caching
- Media layer: Stream Video SDK for room-based call setup and media orchestration
- Security: JWT auth, CORS, helmet, and rate limiting
