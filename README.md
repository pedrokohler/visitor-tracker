# Kindling Project

Kindling is a full-stack web application designed to simulate real-time visitor activity tracking on a website. Built with React (Vite) for the frontend and NestJS (Node.js + TypeScript) for the backend, the application captures session events and enriches them with user information in real-time.

The project was created based on the instructions contained [here](https://www.notion.so/pedrokohler/Kindling-Real-World-Coding-Challenge-1d4ddcc075e280858fcde597ada59df3). If the URL is unavailable refer to the [challenge section](#challenge)

### Project Structure

The repository contains two distinct directories:

* /frontend - React.js UI built with Vite.

* /backend - API service built with NestJS.

For further instructions regarding each project, take a look at the respective `README.md` file.

Notice that both projects contain example `.env` files in their root folder.

### Project Details

* Real-time updates: Frontend connects to the backend via WebSocket (socket.io) and listens for the session_changed event for granular control of each session.

* Initial Load: Frontend fetches initial session data through HTTP from the backend.

* Data Caching: Backend uses node-cache to efficiently manage session data and reduce external API requests.

* Session Cleanup: Idle sessions are automatically cleaned up based on TTL configuration.

### Challenge

#### **Objective**

Your task is to implement **Kindling**, a web application that displays the real-time visitor activity on another website.

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
$ cd visitor-tracker/third-party-apis
$ npm install
$ npx tsc
```

<aside>
💡

If you are unable to clone the repository due to missing SSH keys, please download the code from GitHub by going to the [repository home page](https://github.com/pedrokohler/kindling-api).

![CleanShot 2025-03-03 at 08.15.22@2x.png](attachment:bcdaccc6-46f1-4521-857e-dd8a4992904d:CleanShot_2025-03-03_at_08.15.222x.png)

</aside>

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
...
(Ctrl+C twice to exit)
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
$ curl -X POST http://localhost:4830/deanonymize \
     -H "Content-Type: application/json" \
     -d '{"ip": "185.242.214.177"}'

# Response:
# {"ip":"185.242.214.177","data":{"company":{"guid":"3135c4b9-c0b3-4f97-95db-a98629417b62","name":"NextWave Technologies","domain":"nextwavetechnologies.com"},"contact":{"guid":"749e079e-d8cf-456a-9f39-738d37261d8c","name":"Anil Nair","title":"VP of HR","phoneNumbers":["+1-202-390-3373"],"emailAddresses":["anil@nextwavetechnologies.com","anair@aol.com","anil.nair@hotmail.com"]}}}
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

<aside>
🤖

You are allowed to use AI coding tools to complete this project. However, **you must be able to fully explain your code** and be ready to modify it without the help of AI in a pairing session with an interviewer. The focus is on your **problem-solving and coding abilities, not just the final result**.

</aside>

###### **Functional Requirements**

- Display a **table of active visitors** on the browser UI, showing:
    - their IP addresses
    - available contact & company information
    - time since session opened
    - time since last activity

    Do not show any extra additional information like GUIDs that might confuse a business user of the application.

- The UI should **update in real time** without needing a manual page refresh.
- Also display two **aggregated statistics** also on the UI that update in real-time.
    - average number of visitors per company
    - average session duration time
- Some contacts have personal email addresses from services like GMail, Yahoo! Mail, Hotmail, or AOL. **Do not show personal emails** in the UI.
- A large number of IPs resolve to couple of data centers:
    - NexaCore Data Systems (GUID:`b8e8879e-3382-4908-8f1e-7638473d0913`)
    - VertexCloud (GUID:`830886a1-728e-4d94-a808-44a92841154b`)

    This is due to a bug in our deanonymization database. Do not show these in the UI.

- **Remove stale sessions.** In the real-world website visitor sessions last many minutes. But in this simulation, the SessionsEmitter is coded to always end sessions before 2 minutes. Remove stale sessions that have not been updated for more than 1 minute.

###### **Non-Functional Requirements**

- Both sessionsEmitter and deanonymizer can behave erratically. Handle errors in the system gracefully.
- Calling the `/deanomyize` API costs us money. Cache frequently deanomyized IPs to reduce costs.

###### **Backend & Frontend Technologies**

- **Backend:** TypeScript + Node.js. Use any nodejs web server framework.
- **Frontend:** ReactJS + Typescript.
- **No database** should be used. All data should be stored in memory.
- **No CSS or styling is required**—we are evaluating functionality, not appearance.

---

#### **Guidelines**

- 🕠 We expect this assignment to take **4-6 hours** of your time.
- **📝 Keep your code as simple as possible** while being functionally correct. You should strive to make it easy for a novice engineer to understand your code. The goal is not to be clever; it's to write maintainable, clear code.
- 📁 **Organize your code** as you would do for a production application with appropriate file and directory structures.
- **📝Very important:** Include a `README` file describing how to run the project.
- 🚫 Don't prematurely optimize. In fact, there should be little need to optimize at all for this take-home.
- 🚫 Please **don't put your code on GitHub** or any other public service, as we don't want other interviewees to copy your solution.
- 📖 We recommend you **spend some time upfront** reading, understanding these instructions, and thinking through the approach you will use before starting the implementation.
- 🧪 Consider writing **tests** for the business logic of the application. Tests are not absolutely required, but would be greatly appreciated.
- 🚫 We mentioned this once, but it bears repeating - do not modify the starter code in any way. Please **place your code in a separate folder** outside of the `kindling-api` folder.
- ✉️ After completing this assignment, please send an archive (`.zip`, `.tar`, `.tar.gz` etc) of your code to us at `kindling@warmly.ai`. Our email server **rejects large attachments and those with executable files**. So, please remove all build files, `npm_modules` etc from the archive and include just the `.ts`, `.tsx`, `.json`, and `.html` files only.