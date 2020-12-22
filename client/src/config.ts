// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'en22y4wdzb'
export const apiEndpoint = `https://${apiId}.execute-api.eu-west-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'martinseanhunt.eu.auth0.com', // Auth0 domain
  clientId: 'MZ2gPjvyLJNMFIPZQVoL0ZQa4KmKdzCN', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
