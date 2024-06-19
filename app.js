import { createServer } from 'node:net';

export const app = {
  findAvailablePort(desiredPort) {
    return new Promise((res, rej) => {
      const server = createServer();

      server.listen(desiredPort, () => {
        const { port } = server.address();
        server.close(() => {
          res(port);
        });
      });

      server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          this.findAvailablePort(0).then(port => {
            server.close(() => {
              res(port);
            });
          });
        } else {
          rej(err);
        }
      });
    });
  },
  
  async isPortAvailable(port) {
    return port == await this.findAvailablePort(port)
  }
}
