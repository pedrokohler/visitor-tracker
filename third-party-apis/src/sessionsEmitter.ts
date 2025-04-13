import WebSocket, { WebSocketServer } from "ws"
import { db } from "./db"
import * as util from "node:util";
import {generateGUID} from "./utils";

const SESSIONS_EMITTER_PORT = 8080
const IPS = db.map(r => r.ip)
const HOT_IPS = IPS.slice(0, 100)
const INFREQUENT_IPS = IPS.slice(100)

const IPS_WITH_NO_MAPPINGS = [
  "1.53.143.220",
  "225.87.133.58",
  "4d1d:fc13:f032:69f7:c3e9:d488:342d:9eba",
  "b3b0:7f4b:36c8:f788:830d:f2fb:5fd5:397a",
  "110.178.96.87"
]

const clients: Set<WebSocket> = new Set()
const activeSessions = new Set<string>()

const SCENARIOS: Array<() => void> = [
  // The first half of the array are sessionOpKAsClNormal functions
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  sessionOpKAsClNormal,
  // The second half are all pathologies, one each
  sessionKAsOpKAsClPathology,
  sessionOpKAsClClPathology,
  sessionOpKAsNoClPathology,
  sessionOpOpKAsClPathology,
  sessionOpKAsClKAsPathology,
  sessionOpOpKAsClPathology,
  sessionNoIpMappingPathology,
  killEmAllPathology,
  sessionWithHotIps,
  sessionWithPersonalEmail,
  sessionResolvingToDataCenters,
]
export type EventType = "session-opened" | "session-closed" | "keep-alive"

export type Message = {
  eventType: EventType
  ip: string,
  guid: string,
  timestamp: string
}

const setTimeoutP = util.promisify(setTimeout)

function getInActiveIP(): string {
  let ip = ""
  while (true) {
    // 70% of times, get an infrequent IPs
    // the rest 30% times, get one of the frequent IPs
    ip = Math.random() <= 0.7 ? getRandomElement(INFREQUENT_IPS) : getRandomElement(HOT_IPS)
    if (! activeSessions.has(ip)) return ip
  }
}

function getRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array is empty");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

async function waitABit(maxSecs: number): Promise<void> {
  const waitTime = Math.floor(Math.random() * maxSecs * 1000)
  await setTimeoutP(waitTime)
}

async function sendKAs(guid: string, ip: string): Promise<void> {
  const nKAs = Math.floor(Math.random() * 10)
  for (let i = 0; i < nKAs; i++) {
    // send keep-alive messages randomly between [0-15) seconds
    await waitABit(15)
    sendSessionKeepAlive(guid, ip)
  }
}

async function sessionOpKAsClNormal(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = sendSessionOpenedMsg(ip)
  await sendKAs(guid, ip)
  await waitABit(15)
  sendSessionClosedMsg(guid, ip)

  activeSessions.delete(ip)
}

async function sessionOpOpKAsClPathology(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = sendSessionOpenedMsg(ip)
  sendSessionOpenedMsg(ip, guid) // two OPEN events
  await sendKAs(guid, ip)
  await waitABit(15)
  sendSessionClosedMsg(guid, ip)

  activeSessions.delete(ip)
}

async function sessionOpKAsClClPathology(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = sendSessionOpenedMsg(ip)
  sendSessionOpenedMsg(ip, guid)
  await sendKAs(guid, ip)
  await waitABit(15)
  sendSessionClosedMsg(guid, ip)
  sendSessionClosedMsg(guid, ip) // an extra CLOSE event

  activeSessions.delete(ip)
}

async function sessionOpKAsNoClPathology(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = sendSessionOpenedMsg(ip)
  sendSessionOpenedMsg(ip, guid)
  await sendKAs(guid, ip)
  // no CLOSE event

  activeSessions.delete(ip)
}

async function sessionKAsOpKAsClPathology(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = generateGUID()
  await sendKAs(guid, ip) // some KA events before OPEN
  sendSessionOpenedMsg(ip, guid)
  await sendKAs(guid, ip)
  await waitABit(15)
  sendSessionClosedMsg(guid, ip)

  activeSessions.delete(ip)
}

async function sessionOpKAsClKAsPathology(ip: string = getInActiveIP()): Promise<void> {
  activeSessions.add(ip)

  const guid = sendSessionOpenedMsg(ip)
  await sendKAs(guid, ip)
  await waitABit(15)
  sendSessionClosedMsg(guid, ip)
  await sendKAs(guid, ip) // Extra KA events after the session is closed

  activeSessions.delete(ip)
}

async function sessionNoIpMappingPathology(): Promise<void> {
  const inactive = IPS_WITH_NO_MAPPINGS.filter(i => !activeSessions.has(i))
  if (inactive.length === 0) return

  const ip = getRandomElement(inactive)
  await sessionOpKAsClNormal(ip)
}

async function sessionWithHotIps(): Promise<void> {
  const inactive = HOT_IPS.filter(i => !activeSessions.has(i))
  if (inactive.length === 0) return

  const ip = getRandomElement(inactive)
  await sessionOpKAsClNormal(ip)
}

async function sessionWithPersonalEmail(): Promise<void> {
  const ipsWithPersonalEmail = [
    "171.180.34.161", // <- only personal emails
    "207.17.199.159",
    "5318:1b12:24ca:5bf2:8b30:285b:8e73:ef57",
    "6be3:db19:7c1:4c7f:3255:78c5:e57c:e415",
    "7943:d0a:ecad:46c1:e52c:c591:6449:e0ee",
    "fec:a963:521:61da:babe:f7c9:a9d1:90dc",
    "6367:b414:9922:edcc:c6a:2d2:2d71:fce4",
  ]
  const inactive = ipsWithPersonalEmail.filter(i => !activeSessions.has(i))
  if (inactive.length === 0) return

  const ip = getRandomElement(inactive)
  await sessionOpKAsClNormal(ip)
}

async function sessionResolvingToDataCenters(): Promise<void> {
  const ipsResolvingToDataCenters = [
    "6560:3575:3d44:a7f9:37c2:6742:63c:c7be",
    "7996:385f:c93d:dd9c:7de5:74fc:62cf:f731",
    "eb7d:11ad:2ef4:f92f:4d89:d353:9bae:7dab",
    "112.144.93.57",
    "d6a9:ed7d:3b8c:5660:609d:95f9:f4bf:be9d",
  ]
  const inactive = ipsResolvingToDataCenters.filter(i => !activeSessions.has(i))
  if (inactive.length === 0) return

  const ip = getRandomElement(inactive)
  await sessionOpKAsClNormal(ip)
}

function killEmAllPathology(): void {
  console.log(`Killing all ${clients.size} connections`)
  for (const client of clients) {
    client.close()
  }
}

async function nextTick(): Promise<void> {
  try {
    getRandomElement(SCENARIOS)()
  } catch (e) {
    console.error(`error performing next tick`, e)
  }
}

function sendSessionOpenedMsg(ip: string, guid: string = generateGUID()): string {
  const sessionOpened: Message = {
    eventType: "session-opened",
    ip,
    guid,
    timestamp: new Date().toISOString()
  }
  const jsonString = JSON.stringify(sessionOpened)
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonString)
    }
  })
  return guid
}

function sendSessionKeepAlive(guid: string, ip: string): void {
  const sessionClosed: Message = {
    eventType: "keep-alive",
    ip,
    guid,
    timestamp: new Date().toISOString()
  }
  const jsonString = JSON.stringify(sessionClosed)
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonString)
    }
  })
}

function sendSessionClosedMsg(guid: string, ip: string): void {
  const sessionClosed: Message = {
    eventType: "session-closed",
    ip,
    guid,
    timestamp: new Date().toISOString()
  }
  const jsonString = JSON.stringify(sessionClosed)
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonString)
    }
  })
}

async function run(): Promise<void> {
  while (true) {
    await nextTick()

    // new visitors arrive between 0-10 seconds
    const nextVisitorInterval = Math.floor(Math.random() * 10 * 1000)
    await setTimeoutP(nextVisitorInterval)
  }
}

function start(): void {
  const wss = new WebSocketServer({ port: SESSIONS_EMITTER_PORT })
  console.log(`SessionsEmitter server running on ws://localhost:${SESSIONS_EMITTER_PORT}`)

  wss.on("connection", (ws) => {
    console.log("New client connected")
    clients.add(ws)

    ws.on("close", () => {
      console.log("Client disconnected")
      clients.delete(ws)
    })
  })

  run()
}

start()

