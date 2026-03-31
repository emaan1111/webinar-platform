import https from 'node:https'

type FacebookJsonResponse = {
  data?: any[]
  error?: {
    code?: number
    message?: string
  }
}

export async function requestFacebookInsights(url: string): Promise<{
  ok: boolean
  status: number
  data: FacebookJsonResponse
}> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4, timeout: 20000 }, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })

      response.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          const status = response.statusCode || 500
          resolve({
            ok: status >= 200 && status < 300,
            status,
            data: parsed
          })
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('timeout', () => {
      req.destroy(new Error('Facebook API request timed out'))
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}