# Set Up

```bash
$ git clone https://github.com/pedrokohler/visitor-tracker.git
$ cd visitor-tracker/third-party-apis
$ npm install
$ npx tsc
$
```

# SessionsEmitter
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
The events emitted by the sessionsEmitter can be described by the types:
```typescript
type SessionsEmitterEventType = "session-opened" | "session-closed" | "keep-alive"

type SessionsEmitterMessage = {
  eventType: SessionsEmitterEventType
  ip: string,
  guid: string,
  timestamp: string
}
```

# Deanonymizer
To start the deanonymizer, run the following in a terminal window:
```bash
$ node build/deanonymizer.js
Deanonymizer server running on http://localhost:4830
...
```
Clients can make POST requests to the deanonymizer as:
```bash
$ curl -X POST http://localhost:4830/deanonymize \
     -H "Content-Type: application/json" \
     -d '{"ip": "185.242.214.177"}'

# Response:
# {"ip":"185.242.214.177","data":{"company":{"guid":"3135c4b9-c0b3-4f97-95db-a98629417b62","name":"NextWave Technologies","domain":"nextwavetechnologies.com"},"contact":{"guid":"749e079e-d8cf-456a-9f39-738d37261d8c","name":"Anil Nair","title":"VP of HR","phoneNumbers":["+1-202-390-3373"],"emailAddresses":["anil@nextwavetechnologies.com","anair@aol.com","anil.nair@hotmail.com"]}}}
```

The requests to and responses from the deanonymizer can be described by the types:
```typescript
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