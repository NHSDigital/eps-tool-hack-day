import _epsPrepare from "./prepare.json"
import { getAuthToken } from "./getToken"

const FHIR_BASE_URL = "https://internal-dev.api.service.nhs.uk/fhir-prescribing"

type FhirClient = {
  post: (path: string, body: unknown) => Promise<unknown>
}

export async function call_fhir(): Promise<FhirClient> {
  const token = await getAuthToken()

  return {
    post: async (path: string, body: unknown) => {
      const response = await fetch(`${FHIR_BASE_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: token,
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`FHIR request failed: ${response.status} ${response.statusText} ${errorText}`)
      }

      return response.json()
    }
  }
}

export function shortPrescriptionId() {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = crypto.randomUUID().replace(/-/g, "").toUpperCase()
  const first = hexString.substring(0, 6)
  const middle ="A12345"
  const last = hexString.substring(12, 17)
  let prescriptionID = `${first}-${middle}-${last}`
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * 2 ** (prscIDLength - index)
  })
  const checkValue = (38 - (runningTotal % 37)) % 37
  const checkDigit = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue + 1)
  prescriptionID += checkDigit
  return prescriptionID
}

export function getPrepareTemplate() {
  return JSON.parse(JSON.stringify(_epsPrepare))
}

function setBundleIdAndValue(data: any, resourceType = "others") {
  const identifierValue = crypto.randomUUID()
  data.id = crypto.randomUUID()
  if (resourceType === "claim") {
    data.identifier[0].value = identifierValue
  } else {
    data.identifier.value = identifierValue
  }
  return identifierValue
}

function updateMessageHeader(entry: any, site: any) {
  if (entry.resource.resourceType === "MessageHeader") {
    entry.fullUrl = "urn:uuid:" + crypto.randomUUID()
    entry.resource.destination[0].receiver.identifier.value = site
  }
}

export async function preparePrescription(numberToCreate: number) {
  let position = 2
  let resp = null
  const site = "A83008"

  for (let i = 0; i < numberToCreate; i++) {
    const now = new Date()
    const later = new Date()
    later.setMonth(later.getMonth() + 3)

    const validStart = `${now.getFullYear()}-${("0" + (now.getMonth() + 1)).slice(-2)}-${("0" + now.getDate()).slice(-2)}`
    const validEnd = `${later.getFullYear()}-${("0" + (later.getMonth() + 1)).slice(-2)}-${("0" + later.getDate()).slice(-2)}`
    const shortPrescId = shortPrescriptionId()
    const longPrescId = crypto.randomUUID()
    let addRefId = false

    console.log(shortPrescId)
    const data = getPrepareTemplate()

    const identifierValue = setBundleIdAndValue(data, "others")


    for (const entry of data.entry) {
      if (entry.resource.resourceType === "MedicationRequest") {

        entry.resource.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
        entry.resource.groupIdentifier.value = shortPrescId
        entry.resource.dispenseRequest.validityPeriod.start = validStart
        entry.resource.dispenseRequest.validityPeriod.end = validEnd
        entry.resource.dispenseRequest.performer.identifier.value = site

      }
      updateMessageHeader(entry, site)
    }

    const preparedPrescription = new Map()
    preparedPrescription.set("shortPrescId", shortPrescId)
    preparedPrescription.set("longPrescId", longPrescId)
    preparedPrescription.set("identifierValue", identifierValue)
    preparedPrescription.set("prepareRequest", data)
    preparedPrescription.set("addRefId", addRefId)

    await (await call_fhir())
      .post("/FHIR/R4/$prepare", data)
      .then((_data) => {
        resp = _data
      })
      .catch((err) => {
        console.log(err)
      })
  }
}
