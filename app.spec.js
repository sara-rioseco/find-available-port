import { createServer } from 'node:net';
import { app } from './app';

jest.mock('node:net', () => ({
  createServer: jest.fn(),
}));

describe('app', () => {
  let server, listenMock, closeMock, onMock;

  beforeEach(() => {
    listenMock = jest.fn((port, callback) => {
      setImmediate(callback);
    });
    closeMock = jest.fn((callback) => callback());
    onMock = jest.fn();
    addressMock = jest.fn(() => ({ port: 3000 }));

    server = {
      listen: listenMock,
      close: closeMock,
      on: onMock,
      address: addressMock,
      emit: jest.fn((event, error) => {
        if (event === 'error') {
          onMock.mock.calls.find(call => call[0] === 'error')[1](error);
        }
      })
    };

    createServer.mockReturnValue(server);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('find', () => {
    it('should return the desired port if it is available', async () => {
      const desiredPort = 3000;

      const port = await app.find(desiredPort);

      expect(listenMock).toHaveBeenCalledWith(
        desiredPort,
        expect.any(Function)
      );
      expect(closeMock).toHaveBeenCalled();
      expect(port).toBe(desiredPort);
    });

    it('should return a different port if the desired port is in use', async () => {
      const desiredPort = 3000;
      const fallbackPort = 4000;

      addressMock.mockReturnValueOnce({ port: fallbackPort });

      onMock.mockImplementationOnce((event, handler) => {
        if (event === 'error') {
          handler({ code: 'EADDRINUSE' });
        }
      });

      const port = await app.find(desiredPort);

      expect(listenMock).toHaveBeenCalledWith(
        desiredPort,
        expect.any(Function)
      );
      expect(listenMock).toHaveBeenCalledWith(0, expect.any(Function));
      expect(closeMock).toHaveBeenCalled();
      expect(port).toBe(fallbackPort);
    });
    it('should reject the promise if an unknown error occurs', async () => {
      const desiredPort = 3000;
      const error = new Error('Unknown error');

      listenMock.mockImplementationOnce(() => {
        throw error;
      });

      await expect(app.find(desiredPort)).rejects.toThrow(error);

      expect(listenMock).toHaveBeenCalledWith(
        desiredPort,
        expect.any(Function)
      );
      expect(closeMock).not.toHaveBeenCalled();
    });
    it('should return a fallback port if EADDRINUSE error occurs', async () => {
      const desiredPort = 3000;
      const fallbackPort = 4000;
    
      addressMock.mockReturnValueOnce({ port: fallbackPort });
    
      onMock.mockImplementationOnce((event, handler) => {
        if (event === 'error') {
          handler({ code: 'EADDRINUSE' });
        }
      });
    
      const port = await app.find(desiredPort);
    
      expect(listenMock).toHaveBeenCalledWith(desiredPort, expect.any(Function));
      expect(listenMock).toHaveBeenCalledWith(0, expect.any(Function));
      expect(closeMock).toHaveBeenCalled();
      expect(port).toBe(fallbackPort);
    });
    it('should reject the promise if an unknown error occurs (else branch)', async () => { 
      const desiredPort = 3000;
      const error = new Error('Other error');
      error.code = 'OTHER_ERROR';

      onMock.mockImplementationOnce((event, handler) => {
        if (event === 'error') {
          handler(error);
        }
      });

      server.listen = listenMock;
      server.on = onMock;

      await expect(app.find(desiredPort)).rejects.toThrow(error);

      expect(listenMock).toHaveBeenCalledWith(desiredPort, expect.any(Function));
      expect(closeMock).not.toHaveBeenCalled();
    });
  });



  describe('isAvailable', () => {
    it('should return true if the port is available', async () => {
      const desiredPort = 3000;
      jest.spyOn(app, 'find').mockResolvedValue(desiredPort);

      const result = await app.isAvailable(desiredPort);

      expect(result).toBe(true);
      expect(app.find).toHaveBeenCalledWith(desiredPort);
    });

    it('should return false if the port is not available', async () => {
      const desiredPort = 3000;
      jest.spyOn(app, 'find').mockResolvedValue(4000);

      const result = await app.isAvailable(desiredPort);

      expect(result).toBe(false);
      expect(app.find).toHaveBeenCalledWith(desiredPort);
    });
  });
});
