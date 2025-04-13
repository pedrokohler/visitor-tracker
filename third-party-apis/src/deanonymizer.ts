import express, { Request, Response } from "express"
import {db} from "./db"
import {DeanonymizedRecord} from "./datagen/types"
import util from "node:util";
import {generateGUID} from "./utils";

export const DEANON_END_POINT = "/deanonymize"
export const DEANON_WH_END_POINT = "/deanonymize2"
export const DEANON_PORT = 4830
const setTimeoutP = util.promisify(setTimeout)

const DB = db.reduce((acc, rec) => {
  acc[rec.ip] = rec
  return acc
}, {} as Record<string, DeanonymizedRecord>)

const app = express()
app.use(express.json())

app.post(DEANON_END_POINT, (req: Request, res: Response) => {
  const {ip} = req.body as {ip: string}

  const result = DB[ip]
  if (!result) {
    console.log(`[404] no mapping for ${ip}`)
    return res.status(404).send(`No mapping found for ${ip}`)
  }
  if (!result.data.company && !result.data.contact) {
    console.log(`[404] no mapping for ${ip}`)
    return res.status(404).send(`No mapping found for ${ip}`)
  }
  if (Math.random() <= 0.1) {
    console.log(`[500] server too busy; please retry after some time ${ip}`)
    return res.status(500).send("Server too busy; please retry after some time")
  }

  console.log(`[200] deanonymized ${ip} to company ${result.data.company?.guid}, contact ${result.data.contact?.guid}`)
  return res.status(200).json(result)
})

app.post(DEANON_WH_END_POINT, async (req: Request, res: Response) => {
  const {ip, wh} = req.body as {ip: string, wh: string}
  const guid = generateGUID()
  res.status(200).json({guid})

  await setTimeoutP(Math.random() * 2000)

  try {
    const result = DB[ip]
    if (!(result && (result.data.company || result.data.contact))) {
      console.log(`[WH] no mapping for ${ip}`)
      await fetch(wh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({guid, ip, data: {}})
      })
    } else {
      console.log(`[WH] deanonymized ${ip} to company ${result.data.company?.guid}, contact ${result.data.contact?.guid}`)
      await fetch(wh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({guid, ...result})
      })
    }
  } catch (e) {
    console.log(`Error invoking WH ${wh} for IP ${ip}: ${JSON.stringify(e)}`)
  }
})

app.listen(DEANON_PORT, () => {
  console.log(`Deanonymizer server running on http://localhost:${DEANON_PORT}`)
})
