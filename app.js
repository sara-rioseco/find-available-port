import { createServer } from 'node:net';

export const app = {
  find(desiredPort) {
    return new Promise((res, rej) => {
      const server = createServer();

      server.listen(desiredPort, () => {
        const { port } = server.address();
        server.close(() => {
          res(port);
        });
      });

      server.on('error', err => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          this.find(0).then(port => {
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
  
  async isAvailable(port) {
    return port == await this.find(port)
  }
}
