// @ts-nocheck
import { UseMock, WebSocketMockUrl } from "@conf/main";
import { MockRequestI } from "./Interface";
import { CL } from "../Logger";

export class WebSocketClient {
  _socket: WebSocket | null = null;
  connectionUrl: string;
  reconnectTimeout: number;

  constructor(connectionUrl: string, reconnectTimeout: number) {
    // URL of the WebSocket server
    this.connectionUrl = connectionUrl;
    // Reconnection timeout in seconds
    this.reconnectTimeout = reconnectTimeout || 3;
  }

  get isOpened() {
    return this._socket && this._socket.readyState === 1;
  }

  get isClosed() {
    return (
      !this._socket ||
      this._socket.readyState === 2 ||
      this._socket.readyState === 3
    );
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
    try {
      this._socket = new WebSocket(
        UseMock ? WebSocketMockUrl : this.connectionUrl
      );
      this._onopen();
      this._onerror();
      this._onclose();
    } catch (error_msg) {
      this._eventHandlers.onError(error_msg);
      throw new Error(`Connection error: ${error_msg}`);
    }
  }

  send<T>(realRequest: T, mockRequest: MockRequestI, cb?: void) {
    if (this.isClosed) {
      this.connectSocket();
      // @ts-ignore: Unreachable code error
      this._onopen(this._send(realRequest, mockRequest, cb));
    } else {
      this._send(realRequest, mockRequest, cb);
    }
  }

  close() {
    if (!this._socket || this.isClosed) return;
    this._socket.close();
  }

  _send<T>(realRequest: T, mockRequest: MockRequestI, cb?: void) {
    let sendMessage: object = {};
    if (UseMock) {
      sendMessage = { realRequest, mockRequest };
    } else {
      // @ts-ignore: Unreachable code error
      sendMessage = realRequest;
    }

    try {
      // @ts-ignore: Unreachable code error
      this._socket.send(this._parseToServer(sendMessage));
      CL.log("_websocket request:", realRequest);
      // @ts-ignore: Unreachable code error
      this._onmessage(cb);
    } catch (error_msg) {
      console.log(this._socket, error_msg);
    }
  }

  _eventHandlers = {
    // Connection error
    // @ts-ignore: Unreachable code error
    onError: (event) => {},
    // Connection was closed
    // @ts-ignore: Unreachable code error
    onClose: (event) => {},
    // Server sent response: data is already parsed!
    onMessage: (data) => {},
    // Connection was opened
    onOpen: (event) => {},
    // Connection was opened for the first time
    // onFirstOpen: (event) => {},
    // Connection was reopened
    // onReopen: (event) => {},
    // Connecting to the server
    //onConnecting: () => {},
    // Request was just sent to the server
    //onProgress: () => {}
  };

  _getProtocol() {
    const protocol = window.location.protocol;
    if (protocol === "https:") {
      return "wss://";
    }
    return "ws://";
  }

  _onopen(cb?: (a: any) => void) {
    this._socket.onopen = (event) => {
      this._eventHandlers.onOpen(event);
      if (cb) cb(event);
    };
  }

  _onmessage(cb?: (a: any) => void) {
    console.log("msg");
    this._socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this._eventHandlers.onMessage(data);
      if (cb) cb(data);
    };
  }

  _onerror() {
    this._socket.onerror = (event) => {
      console.error("Connection error:", event);
      this._eventHandlers.onError(event);
    };
  }

  _onclose() {
    this._socket.onclose = (event) => {
      let message = "Connection was closed. Code: " + event.code;
      if (event.reason) message += ", reason: " + event.reason;
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
