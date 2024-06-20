import { createServer } from 'node:net';
import { app } from './app';

// Mock createServer
jest.mock('node:net', () => ({
  createServer: jest.fn(),
}));

describe('app', () => {
  let listenMock, closeMock, onMock;

  beforeEach(() => {
    listenMock = jest.fn((port, callback) =>  callback());
    closeMock = jest.fn((callback) => callback());
    onMock = jest.fn((error, callback) =>  callback());
    addressMock = jest.fn(() => ({ port: 3000 }));

    createServer.mockImplementation(() => ({
      listen: listenMock,
      close: closeMock,
      on: onMock,
      address: addressMock,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('find', () => {
    it('should return the desired port if it is available', async () => {
      const desiredPort = 3000;

      const port = await app.find(desiredPort);

      expect(listenMock).toHaveBeenCalledWith(desiredPort, expect.any(Function));
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

      expect(listenMock).toHaveBeenCalledWith(desiredPort, expect.any(Function));
      expect(listenMock).toHaveBeenCalledWith(0, expect.any(Function)); // Retries with port 0
      expect(closeMock).toHaveBeenCalled();
      expect(port).toBe(fallbackPort);
    });
    it('should reject the promise if an unknown error occurs', async () => {
      const desiredPort = 3000;
      const error = new Error('Unknown error');

      listenMock.mockImplementationOnce(() => { 
        throw error
      })

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