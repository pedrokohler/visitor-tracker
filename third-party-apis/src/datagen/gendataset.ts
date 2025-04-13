import {Company, Contact} from "./types"
import {companies} from "./companies"
import {contacts} from "./contacts"

export type DeanonymizedRecord = {
  ip: string,
  data: {
    company?: Company,
    contact?: Contact
  }
}

function mkRandomUniqueIPs(n: number): string[] {
  const ips = new Set<string>()
  while (ips.size < n) {
    const ip = (Math.random() <= 0.5) ? mkRandomIPv4() : mkRandomIPv6()
    ips.add(ip)
  }
  return Array.from(ips)
}

function mkRandomIPv4(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".")
}

function mkRandomIPv6(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 0xFFFF).toString(16)).join(":")
}

function removeRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) throw Error("Array is empty")

  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr.splice(randomIndex, 1)[0]
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array] // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // Swap elements
    const si = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = si
  }
  return shuffled
}

function mkEmail(emailStrategy: EmailStrategy, domain: string, contact: Contact): string {
  const splits = contact.name.split(" ")
  let email = ""
  switch (emailStrategy) {
    case "FirstNameDotLastName":
      email = `${splits[0]}.${splits.at(-1)}@${domain}`
      break
    case "FirstNameLastName":
      email = `${splits[0]}${splits.at(-1)}@${domain}`
      break
    case "FLastName":
      email = `${splits[0][0]}${splits.at(-1)}@${domain}`
      break
    case "FirstName":
      email = `${splits[0]}@${domain}`
      break
  }
  return email.toLowerCase()
}

function mkPersonalEmails(contact: Contact): string[] {
  const domains = ["yahoo.com", "gmail.com", "hotmail.com", "aol.com"]
  const emails = new Set<string>()
  const nEmails = 1 + Math.floor(Math.random() * 2)
  while (emails.size < nEmails) {
    const domain = domains[Math.floor(Math.random() * domains.length)]
    const emailStrategy = emailStrategies[Math.floor(Math.random() * emailStrategies.length)]
    const email = mkEmail(emailStrategy, domain, contact)
    emails.add(email)
  }
  return Array.from(emails)
}


type EmailStrategy = "FirstNameDotLastName" | "FirstNameLastName" | "FLastName" | "FirstName"
const emailStrategies:EmailStrategy[] = [
  "FirstNameDotLastName", "FirstNameLastName", "FLastName", "FirstName"
]

function mkRandomRecords():DeanonymizedRecord[] {
  const ips = mkRandomUniqueIPs(1_000_000)
  const records: DeanonymizedRecord[] = []

  const badCompany1: Company = {
    guid: "b8e8879e-3382-4908-8f1e-7638473d0913",
    name: "NexaCore Data Systems",
    domain: "nxcore.com"
  }

  const badCompany2: Company = {
    guid: "830886a1-728e-4d94-a808-44a92841154b",
    name: "VertexCloud",
    domain: "vertexcloud.inc"
  }

  const nBadRecords = 5000 + Math.random() * 0.005 * ips.length
  const badCompanies = [badCompany1, badCompany2]
  for (let i = 0; i < nBadRecords; i++) {
    records.push({
      ip: removeRandomElement(ips),
      data: {
        company: badCompanies[Math.floor(Math.random() * badCompanies.length)]
      }
    })
  }

  console.log(`Made ${records.length} bad records`)
  while (true) {
    // console.log(`  Loop1: ${ips.length} ips, ${companies.length} companies, ${contacts.length} contacts`)
    if (companies.length === 0) return records
    const company = removeRandomElement(companies)
    const emailStrategy = emailStrategies[Math.floor(Math.random() * emailStrategies.length)]
    const nContacts = Math.floor(Math.random() * 30)
    for (let i = 0; i < nContacts; i++) {
      // console.log(`    Loop2: ${ips.length} ips, ${companies.length} companies, ${contacts.length} contacts`)
      if (contacts.length === 0) return records
      const contact = removeRandomElement(contacts)
      if (Math.random() >= 0.1) {
        const workEmail = mkEmail(emailStrategy, company.domain, contact)
        const personalEmails = mkPersonalEmails(contact)
        contact.emailAddresses = [workEmail, ...personalEmails]
      }
      const nIPs = Math.floor(Math.random() * 10)
      for (let j = 0; j < nIPs; j++) {
        // console.log(`      Loop3: ${ips.length} ips, ${companies.length} companies, ${contacts.length} contacts`)
        if (ips.length == 0) return records
        const ip = removeRandomElement(ips)
        const rand = Math.random()
        if (rand <= 0.35) {
          records.push({
            ip, data: {company, contact}
          })
        } else if (rand <= 0.85) {
          records.push({
            ip, data: {company}
          })
        } else {
          records.push({
            ip, data: {}
          })
        }
      }
    }
  }
}

// console.log(`${new Set<string>(companies.map(c => c.guid)).size} unique companies`)
// console.log(`${new Set<string>(contacts.map(c => c.guid)).size} unique contacts`)

const records = mkRandomRecords()
console.log(`Generated ${records.length} records`)
console.log(JSON.stringify(shuffle(records), null, 2))



