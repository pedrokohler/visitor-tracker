# Setup

### Installation

```
cd backend
npm install
```

### Environment Variables

Configure .env like the example below:

```
DEANONYMIZER_URL=http://localhost:4830/deanonymize
SESSIONS_EMITTER_SERVER_URL=ws://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
COMPANY_GUID_BLACKLIST=b8e8879e-3382-4908-8f1e-7638473d0913,830886a1-728e-4d94-a808-44a92841154b
EMAIL_DOMAIN_BLACKLIST=gmail,yahoo,hotmail,outlook,aol
DEFAULT_CACHE_TTL_IN_SECONDS=600
DEFAULT_CACHE_CHECK_PERIOD_IN_SECONDS=0.5
SESSION_EXPIRATION_LIMIT_IN_SECONDS=60
MAX_FETCH_RETRIES=5
```

### Running

```
npm run start:dev
# OR
npm run start:dev:verbose # for verbose logging
```

### Testing

```
npm run test
npm run test:e2e
```

### Backend Functionalities

* Connects to external SessionsEmitter via WebSockets.

* Fetches visitor details from Deanonymizer service.

* Uses caching (node-cache) to reduce external calls.

* Provides WebSocket gateway (socket.io) for frontend real-time updates.

* Manages session lifetimes automatically.

### Logging

Control logging verbosity via LOG_LEVELS:

```
npm run start:dev:verbose
```

Or specify desired levels manually with the LOG_LEVELS environment variable so: `debug,verbose,fatal,error,warn,log`.