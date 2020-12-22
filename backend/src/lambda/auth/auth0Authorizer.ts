import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult
} from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://martinseanhunt.eu.auth0.com/.well-known/jwks.json'

// TODO: remove and use above method
const cert = `-----BEGIN CERTIFICATE-----
MIIDETCCAfmgAwIBAgIJDtpZQ4fMiuPyMA0GCSqGSIb3DQEBCwUAMCYxJDAiBgNV
BAMTG21hcnRpbnNlYW5odW50LmV1LmF1dGgwLmNvbTAeFw0yMDA4MDEwNzAyMjVa
Fw0zNDA0MTAwNzAyMjVaMCYxJDAiBgNVBAMTG21hcnRpbnNlYW5odW50LmV1LmF1
dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL+QJ1Ic2UOj
X+0ILTx68SGV4X+U8I1VZWnZgxA/bczLjJT+gz3zjTRWhvzMTJ591ywSBuDuj4MH
MwdLxJGBfPEEB4RZ5KtFIrxPPKWaNmJzEReV13+oymiOodAkW96ABzQWxuSMVJH2
y2TW+RXKVC6nHkUkoMHQfpLWDBCAtwBQWG6xGV8yeaDNP8aGRufCbRVVaWXfl/NM
yWpNBdIZGcWGWXzB6P7Z897SyIbEBWdsR1Y6LcbkEM7NS3/SY8hxUSojXwckSC+s
EhptXxBms32ZX6y1UDplQrTuPP9wsLGoJiV9KdFwSTVIXFPG6H/89aOyHjAlevFw
VXudxpntG88CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUCSLo
g8wEd9ONgE4+PIobv1S4yjswDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUA
A4IBAQBOf3CurGp2+Q3lVcBG8nPcqUd4MwrqLKtNNSTAXzxVkp0AXbZCnZSU6OmP
8wDr5sWQj2G7e+o+2A0owEIAtDYBZXwEacGdIPANYiFS+QfrtB9AAE0bJfFIMRBy
9dgjUriqVZYlpiNsmJThz8hMvZMEYdVlSgIG0iMsE3GiBLZFG2yKL4gz2t5sHSvG
SebojGa8Wv+cf0aEkfUj2fgKKiCNeNiOHza0Jf/BjDa/XFpWiOuI2HPiCvB+BHLc
XB7VX4rqq56yj4hbh7zONWYvj9WgOTa1xGdfK+uH3+aXpGiZU95Pv8gqioiXC75B
2ImjRE4tbPeLaUNoTYEDu4VZbOa1
-----END CERTIFICATE-----`

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  return verify(token, cert, {
    algorithms: ['RS256']
  }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
