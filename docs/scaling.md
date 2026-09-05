# Scaling and Reliability Notes

## 1. P2P mesh vs SFU

The current app is designed around a lightweight social experience with direct media sessions via Stream Video. In a small-scale deployment, this is a practical starting point because it minimizes setup complexity and keeps call initiation straightforward.

However, as participant counts grow, a pure peer-to-peer mesh becomes difficult to scale reliably because each participant must maintain more connections and upload more media traffic. This increases network overhead and makes quality management harder. In larger rooms, an SFU (Selective Forwarding Unit) architecture is more appropriate because the server relays video streams instead of requiring every user to send copies directly to every other user.

## 2. Horizontal scaling for real-time signaling

For multi-instance deployments, the backend should avoid relying on in-memory socket state alone. The production path is:

- run multiple Node.js backend instances behind a load balancer
- use a Redis adapter for Socket.io so socket rooms and presence are shared across instances
- keep sticky sessions or consistent routing for WebSocket traffic when possible
- centralize user/session state in Redis or a durable store

This preserves room membership consistency and reduces connection drift when a node fails or a user reconnects.

## 3. Reliability trade-offs

The project intentionally favors a simple and dependable architecture for an MVP:

- JWT-based auth for protected endpoints
- allowlist-based CORS for known origins
- rate limiting to reduce abuse and overload
- validation middleware to reject bad payloads early
- request IDs and structured logs for observability

These choices improve correctness and operational clarity without over-engineering the system. For a production-grade global scale, the next step is to add robust media session orchestration and more advanced monitoring.

## 4. Suggested metrics and alerts

Track at minimum:

- call setup time
- call setup success/failure counts
- reconnect attempts and success rates
- socket disconnect rate
- active room count
- concurrent user count

This gives a useful signal-to-noise ratio for debugging telephony and messaging reliability without adding excessive instrumentation cost.
