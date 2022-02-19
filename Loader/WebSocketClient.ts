import { UseMock, WebSocketMockUrl } from '../../../conf/main';
import { CL } from '../Logger';

export class WebSocketClient {
  constructor(connectionUrl, reconnectTimeout) {
    // URL of the WebSocket server
    this.connectionUrl = connectionUrl;

    // Reconnection timeout in seconds
    this.reconnectTimeout = reconnectTimeout || 3;
  }

  _eventHandlers = {
    // Connection error
    onError: (event) => {},
    // Connection was closed
    onClose: (event) => {},
    // Server sent response: data is already parsed!
    onMessage: (data) => {},
    // Connection was opened
    onOpen: (event) => {},
    // Connection was opened for the first time
    onFirstOpen: (event) => {},
    // Connection was reopened
    onReopen: (event) => {},
    // Connecting to the server
    onConnecting: () => {},
    // Request was just sent to the server
    onProgress: () => {}
  };
  async onOpen() {
    await this.socketPromise();
  }

  get isOpened() {
    return this._socket && this._socket.readyState === 1;
  }

  get isClosed() {
    return !this._socket || this._socket.readyState === 2 || this._socket.readyState === 3;
  }

  set isOpened(_) {
    throw new Error("You can't change socket status");
  }

  set isClosed(_) {
    throw new Error("You can't change socket status");
  }

  setEventHandlers(eventHandlers = {}) {
    Object.assign(this._eventHandlers, eventHandlers);
  }

  connectSocket() {
    this._socket = new WebSocket(UseMock ? WebSocketMockUrl : this.connectionUrl);
    return this._socket;
  }
  socketPromise() {
    console.log('this.reopenSocket()?');
    return new Promise((resolve, reject) => {
      this._socket.onopen = function () {
        this.isOpened = true;
        resolve();
      };
      this._socket.onerror = function () {
        this.isOpened = false;
        reject();
      };
    });
  }
  /*openSocket() {
    this._eventHandlers.onConnecting();
    this._promiseOnOpenSocket = new Promise((resolve) => {
      this._getConnectionUrl()
        .then((serverUrl) => {
          if (!serverUrl) throw new Error("Couldn't get websocket server URL");
          this._socket = new WebSocket(UseMock ? WebSocketMockUrl : serverUrl);
          console.log('this._socket', this._socket);
          this._onopen(resolve);
          this._onerror();
          this._onclose();
        })
        .catch((e) => console.error(e?.message));
    });
    return this._promiseOnOpenSocket;
  }*/

  reopenSocket() {
    if (this._socket && this.isOpened) {
      console.log('reopenSocket', this.socketPromise());
      return this.socketPromise();
    }
    this.connectSocket();

    return this.socketPromise();
  }

  send(realRequest, mockRequest, cb?: void) {
    console.log('send');
    const fullRequest = { realRequest, mockRequest };
    CL.log('_websocket request mock:', fullRequest);
    this._socket.send(this._parseToServer(fullRequest));

    this.reopenSocket().then(
      () => {
        console.log('reopens?');
        this._eventHandlers.onProgress();
        if (UseMock) {
          const fullRequest = { realRequest, mockRequest };
          CL.log('_websocket request mock:', fullRequest);
          this._socket.send(this._parseToServer(fullRequest));
        } else {
          CL.log('_websocket request:', realRequest);
          this._socket.send(this._parseToServer(realRequest));
        }
        this._onmessage(cb);
      },
      () => {
        console.log('alarm');
      }
    );
  }

  close() {
    if (!this._socket || this.isClosed) return;
    this._socket.close();
  }

  getProtocol() {
    const protocol = window.location.protocol;
    if (protocol === 'https:') {
      return 'wss://';
    }
    return 'ws://';
  }

  _onopen(cb) {
    this._socket.onopen = (event) => {
      console.log('Connection established');
      if (this.wasConnectedAlready) {
        this._eventHandlers.onReopen(event);
      } else {
        this._eventHandlers.onFirstOpen(event);
      }
      this.wasConnectedAlready = true;
      this._eventHandlers.onOpen(event);
      if (cb) cb(event);
    };
  }

  _onmessage(cb) {
    this._socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this._eventHandlers.onMessage(data);
      if (cb) cb(data);
    };
  }

  _onerror() {
    this._socket.onerror = (event) => {
      console.error('Connection error:', event);
      this._eventHandlers.onError(event);
    };
  }

  _onclose() {
    this._socket.onclose = (event) => {
      let message = 'Connection was closed. Code: ' + event.code;
      if (event.reason) message += ', reason: ' + event.reason;
      console.error(message);
      this._eventHandlers.onClose(event);
      this._tryToReconnect();
    };
  }

  _tryToReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = setInterval(() => {
        if (this.isConnecting || this.isOpened) {
          clearTimeout(this._reconnectTimer);
          return;
        }
        this.reopenSocket();
      }, this.reconnectTimeout * 1e3);
    }
  }

  _parseToServer(data) {
    if (this._isJson(data)) {
      return data;
    }
    return JSON.stringify(data);
  }

  _isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
