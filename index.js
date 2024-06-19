import { app } from './app.js'

let port

if (process.argv.some(arg => arg === '--find')) {
  port = process.argv[3] ?? 0
  const response = await app.findAvailablePort(port)
  console.log(response)
} else {
  port = process.argv[2]
  const isAvailable = await app.isPortAvailable(port)
  console.log(`Port ${port} is`, (isAvailable ? '' : 'not ') +'available.' )
}

