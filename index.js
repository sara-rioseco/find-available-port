import { app } from './app.js'

let port

export const findAvailablePort = async() => {
  if (process.argv.some(arg => arg === '--find')) {
    port = process.argv[2] ?? 0
    const actualPort = await app.find(port)
    const response = Number(port) === actualPort ? `Port ${port} is available.` : `Port ${port} is not available. You can use port ${actualPort} instead.`
    console.log(response)
  } else {
    port = process.argv[2]
    const isAvailable = await app.isAvailable(port)
    console.log(`Port ${port} is`, (isAvailable ? '' : 'not ') +'available.' )
  }
}

findAvailablePort();
