import { PolymerElement } from '../../@polymer/polymer/polymer-element.js';

// constant values according to https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

class WebSocket extends PolymerElement {

  static get is() {
    return 'web-socket';
  }

  static get properties() {
    return {
      /**
       * Enables auto connection with page load
       */
      auto: {
        type: Boolean,
        value: false
      },
      /**
       * Enables auto reconnection connection when the web socket abnormally closes
       */
      autoReconnect: {
        type: Boolean,
        value: true
      },
      /**
       * Time interval for auto reconnection
       */
      autoReconnectInterval: {
        type: Number,
        value: 1000
      },
      /**
       * The URL to which to connect
       */
      url: {
        type: String,
        notify: true
      },
      /**
       * An optional property to provide a single protocol string or an array of protocol strings.
       */
      protocols: {
        type: Array,
        value: []
      },
      /**
       * Specifies the format in which the data is send.
       */
      handleAs: String,
      /**
       * The current state of the WebSocket connection.
       * Notifies about state changes according to https://developer.mozilla.org/en/docs/Web/API/WebSocket#Ready_state_constants
       */
      state: {
        type: Number,
        value: -1, // undefined = ws connect outstanding or trying to establish a ws connect returns error
        notify: true,
        readOnly: true
      },
      /**
       * The most recent request made by this web-socket element.
       * @type {Object}
       */
      lastRequest: {
        type: Object,
        notify: true,
        readOnly: true
      },
      /**
       * The most recent response received by this web-socket element.
       * @type {Object}
       */
      lastResponse: {
        type: Object,
        notify: true,
        readOnly: true
      },
      /**
       * The most recent error received by this web-socket element. If any error occurred.
       * @type {Object}
       */
      lastError: {
        type: Object,
        notify: true,
        readOnly: true
      },
      /**
       * The actual websocket object.
       * @type {Object}
       */
      ws: {
        type: Object,
        readOnly: true
      },
      /**
       * Enables verbose mode
       */
      verbose: {
        type: Boolean,
        value: false
      }
    };
  }

  /**
   * If `auto` is true a WebSocket connection is established with page load.
   */
  connectedCallback() {

    if (this.auto) {
      this._getWebSocket();
    }
  }

  /**
   * Closes WebSocket connection when element is detached from document.
   */
  disconnectedCallback() {
    this.close();
  }

  /**
   * Callback function that's called when websocket connection is open
   * and ready to send and receive data.
   */
  onOpen(event) {
    this._notifyStateChange();
    if (this.verbose) {
      console.info(this.id + " : WebSocket to [%s] established.", this.url, event);
    }

    this.dispatchEvent(new CustomEvent('open', {bubbles: true, composed: true}));
  }

  /**
   * Callback function that's called when websocket connection is closed.
   */
  onClose(event) {
    this._notifyStateChange();

    // see event codes here: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    if(event.code !== 1000)
      this._reconnect();

    if (event.wasClean === true) {
      if (this.verbose) {
        console.info(this.id + " : WebSocket [%s] closed.", this.url, event);
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
      }
    } else {
      if (this.verbose) {
        console.warn(this.id + " : WebSocket [%s] was closed.", this.url, event);
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true, 
          detail: event.reason
        }));
      }
    }
  }

  /**
   * Callback function that's called when a message is received from the server.
   */
  onMessage(event) {
    if (this.verbose) {
      console.info(this.id + " : WebSocket [%s] received message.", this.url, event);
    }
    this._setLastResponse(this.handleAs === 'json' ? JSON.parse(event.data) : event.data);

    this.dispatchEvent(new CustomEvent('message', {bubbles: true, composed: true, 
      detail: this.handleAs === 'json' ? JSON.parse(event.data) : event.data
    }));
  }

  /**
   * Callback function that's called when an error occurs.
   */
  onError(event) {
    this.dispatchEvent(new CustomEvent('error', {bubbles: true, composed: true, 
      detail: event
    }));

    this._setLastError(event);

    if (this.verbose) {
      console.error(this.id + " : WebSocket to [%s] returns error.", this.url, event);
    }

    if(event.code !== 'ECONNREFUSED')
      this._reconnect();
  }

  _reconnect() {
    if(!this.autoReconnect) return;

    setTimeout(function(){
      this._getWebSocket()
    }.bind(this), this.autoReconnectInterval);
  }

  /**
   * Creates a new WebSocket connection if no connection is established so far.
   * Automatically called when `auto` is true.
   */
  open() {
    this._getWebSocket();
  }

  /**
   * Transmits data to the server over the WebSocket connection.
   */
  send(data) {

    var _ws = this._getWebSocket();
    if (_ws != null) {
      if (_ws.readyState === OPEN) {
        var _data = JSON.stringify(data);
        try {
          _ws.send(_data);
        } catch (err) {
          if (this.verbose) {
            console.error(this.id + " : Failed to send message to [%s] WebSocket.", this.url, err);
          }
          this._setLastError(err);
        }
        this._setLastRequest(_data);
      } else {
        if (this.verbose) {
          console.warn(this.id + " : WebSocket connection to [%s] isn't open.", this.url);
        }
      }
    } else {
      if (this.verbose) {
        console.error(this.id + " : WebSocket connection to [%s] is null.", this.url);
      }
    }
  }

  /**
   * Closes the WebSocket connection if still open.
   * If the connection is already closed, this method does nothing.
   */
  close() {

    var _ws = this._getWebSocket();
    if (_ws.readyState === OPEN) {
      _ws.close();
      this._notifyStateChange();
    } else {
      if (this.verbose) {
        console.warn(this.id + ": WebSocket connection isn't open.", _ws);
      }
    }
  }

  /**
   * Called internally to notify about WebSocket.readyState changes.
   */
  _notifyStateChange() {
    if (this.ws != null) {
      this._setState(this.ws.readyState);
    }
  }

  /**
   * Return a new or an existing WebSocket connection if any URL is set.
   */
  _getWebSocket() {

    if (this.ws === null || this.ws === undefined || this.ws != null && this.ws.readyState === CLOSED) {
      if (this.url === undefined) {
        if (this.verbose) {
          console.error(this.id + " : Please provide a valid WebSocket url [%s].", this.url);
        }
      } else {
        this._setWs(this._createWebSocket());
        this._notifyStateChange();
      }
    }
    return this.ws;
  }

  /**
   * Called internally to create a new WebSocket connection.
   */
  _createWebSocket() {

    var _ws = null;
    try {
      _ws = new window.WebSocket(this.url, this.protocols);
      // bind WebSocket events to component events
      _ws.onopen = this.onOpen.bind(this);
      _ws.onclose = this.onClose.bind(this);
      _ws.onmessage = this.onMessage.bind(this);
      _ws.onerror = this.onError.bind(this);
    } catch (err) {
      if (this.verbose) {
        console.error(this.id + " : Establishing WebSocket connection to [%s] failed.", this.url, err);
      }
      this._setLastError(err);
    }
    return _ws;
  }
}
window.customElements.define(WebSocket.is, WebSocket);