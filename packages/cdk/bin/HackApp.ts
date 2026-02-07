import {UsCertsStack} from "../stacks/UsCertsStack"
import {HackStack} from "../stacks/HackStack"
import {
  createApp,
  getConfigFromEnvVar,
} from "@nhsdigital/eps-cdk-constructs"


// define the host names we are going to use for everything

async function main() {
  const {app, props} = createApp({
    productName: "HackApp",
    appName: "HackApp",
    repoName: "hack-app",
    driftDetectionGroup: "hackapp-drift-group",
  })

  const serviceName: string = getConfigFromEnvVar("serviceName")
  const shortCloudfrontDomain = serviceName
  const usCertsStack = new UsCertsStack(app, "UsCertsStack", {
    env: {
      region: "us-east-1"
    },
    serviceName: serviceName,
    crossRegionReferences: true,
    stackName: `${serviceName}-us-certs`,
    shortCloudfrontDomain: shortCloudfrontDomain
  })

  const hackStack = new HackStack(app, "HackStack", {
    env: {
      region: "eu-west-2"
    },
    serviceName: serviceName,
    stackName: `${serviceName}-stateful-resources`,
    shortCloudfrontDomain: shortCloudfrontDomain,
    fullCloudfrontDomain: usCertsStack.fullCloudfrontDomain,
    crossRegionReferences: true
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
