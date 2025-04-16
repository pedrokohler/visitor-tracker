
# Visitor Tracker Project

This is a full-stack web application designed to simulate real-time visitor activity tracking on a website as part of a coding challenge. Built with React (Vite) for the frontend and NestJS (Node.js + TypeScript) for the backend, the application captures session events and enriches them with user information in real-time.

### Project Structure

The repository contains two distinct directories:

* /frontend - React.js UI built with Vite.
* /backend - API service built with NestJS.
* /thid-party-apis

For further instructions regarding each project, take a look at the respective `README.md` file.

Notice that both projects contain example `.env` files in their root folder.

### Project Details

* Real-time updates: Frontend connects to the backend via WebSocket (socket.io) and listens for the session_changed event for granular control of each session.
* Initial Load: Frontend fetches initial session data through HTTP from the backend.
* Data Caching: Backend uses node-cache to efficiently manage session data and reduce external API requests.
* Session Cleanup: Idle sessions are automatically cleaned up based on TTL configuration.

### Challenge

#### **Objective**

Your task is to implement a web application that displays the real-time visitor activity on another website.

---

#### **Setup API Code**

For the purposes of this application, we are not tracking actual website visitors; we are simulating it instead. For this, we provide two API services written in Node.js. This section provides instructions to build the API services and usage examples.

<aside>
⚠️
**Do not modify the API code in any way. This is not starter code.**
</aside>

To clone and build our API server, open a terminal and execute the following:

```bash
$ git clone git@github.com:pedrokohler/visitor-tracker.git
$ cd visitor-tracker/thid-party-apis
$ npm install
$ npx tsc
```

###### **SessionsEmitter**

To start the SessionsEmitter, run the following in a terminal window:

```bash
$ node build/sessionsEmitter.js
SessionsEmitter server running on ws://localhost:8080
...
```

Web socket clients can connect to it and receive messages as (say, on the REPL):

```bash
$ node
> const WebSocket = require('ws')
> const ws = new WebSocket('ws://localhost:8080')
ws.on('message', (data) => { console.log('Received:', data.toString()) })
>
Received: {"eventType":"session-opened","ip":"8eb:c453:a25e:f5ea:3859:d938:4ffa:d528","guid":"59ef0b55-de86-48b0-aa78-a785afbd7ecd","timestamp":"2025-03-03T04:04:00.280Z"}
Received: {"eventType":"session-opened","ip":"203.225.30.200","guid":"9d8802fe-631a-4591-b1d8-c030870dea05","timestamp":"2025-03-03T04:04:01.984Z"}
Received: {"eventType":"session-opened","ip":"84.83.199.176","guid":"c7522ac4-038e-4ae1-90db-f540aec206f7","timestamp":"2025-03-03T04:04:03.153Z"}
Received: {"eventType":"session-closed","ip":"373c:e94d:2ba:cc86:6113:68f8:282d:efff","guid":"ddace2a5-ec53-428f-985d-952fa09e7f27","timestamp":"2025-03-03T04:04:03.489Z"}

```

The events emitted by the SessionsEmitter can be described by the types:

```tsx
type SessionsEmitterEventType = "session-opened" | "session-closed" | "keep-alive"

type SessionsEmitterMessage = {
  eventType: SessionsEmitterEventType
  ip: string,
  guid: string,
  timestamp: string
}
```

###### **Deanonymizer**

To start the Deanonymizer, run the following in a terminal window:

```bash
$ node build/deanonymizer.js
Deanonymizer server running on http://localhost:4830
...
```

Clients can make `POST` requests to the Deanonymizer as:

```bash
$ curl -X POST http://localhost:4830/deanonymize      -H "Content-Type: application/json"      -d '{"ip": "185.242.274.177"}'
```

The requests to and responses from the Deanonymizer can be described by the types:

```tsx
type DeanonymizerRequest = {
  ip: string
}

type Contact = {
  guid: string,
  name: string,
  title?: string,
  emailAddresses?: string[],
  phoneNumbers?: string[]
}

type Company = {
  guid: string,
  name: string,
  domain: string
}

type DeanonymizerResponse = {
  ip: string,
  data: {
    company?: Company,
    contact?: Contact
  }
}
```

---

#### Requirements

Write a backend service to **connect to the SessionsEmitter** service via WebSockets and **listen** for visitor session events. When a visitor arrives, make a **POST request to the Deanonymizer** service to retrieve available **company** and **contact** details. Your service should have a frontend that shows the list of active visitors on a browser UI.

###### **Functional Requirements**

- Display a **table of active visitors** on the browser UI, showing:
    - their IP addresses
    - available contact & company information
    - time since session opened
    - time since last activity

- The UI should **update in real time** without needing a manual page refresh.
- Also display two **aggregated statistics** also on the UI that update in real-time.
    - average number of visitors per company
    - average session duration time
- Some contacts have personal email addresses from services like GMail, Yahoo! Mail, Hotmail, or AOL. **Do not show personal emails** in the UI.
- A large number of IPs resolve to couple of data centers:
  - GUID:b8e8879e-3382-4908-8f1e-7638473d0913
  - GUID:830886a1-728e-4d94-a808-44a92841154b
 Do not show these in the UI.
- **Remove stale sessions.** Remove sessions that have not been updated for more than 1 minute.

###### **Non-Functional Requirements**

- Both sessionsEmitter and deanonymizer can behave erratically. Handle errors in the system gracefully.
- Calling the `/deanomyize` API costs money. Cache frequently deanomyized IPs to reduce costs.

###### **Backend & Frontend Technologies**

- **Backend:** TypeScript + Node.js. Use any nodejs web server framework.
- **Frontend:** ReactJS + Typescript.
- **No database** should be used. All data should be stored in memory.
- **No CSS or styling is required**—focus on functionality.

---

#### **Guidelines**

- 📝 Keep your code simple and maintainable.
- 📁 Organize your code properly.
- 📖 Include a `README` with setup instructions.
- 🧪 Writing tests is appreciated but not required.
