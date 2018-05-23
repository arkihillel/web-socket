[![License](https://img.shields.io/badge/license-MIT%20License-blue.svg)](http://doge.mit-license.org)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/arkihillel/web-socket)

# \<web-socket\>

A [Polymer 2.0](https://www.polymer-project.org/2.0/) element to ease the usage of [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

## Usage

```html
<web-socket auto
            url="{{url}}"
            protocols="{{protocols}}"
            state="{{state}}"
            last-request="{{request}}"
            last-response="{{response}}"
            last-error="{{error}}"
            on-error="_handleError"
            on-message="_handleMessage"
            on-open="_handleOpen"
            on-close="_handleClose"
            verbose>
</web-socket>
```

The above example illustrates the usage of `<web-socket>` in a [Polymer](https://www.polymer-project.org) app.

Attributes explained:

* __auto__ = Enables auto connection with page load
* __url__ = The URL to which to connect
* __handle-as__ = Empty for the plain message or `json` to get it parsed
* __protocols__ = An optional property to provide a single protocol string or an array of protocol strings.
* __state__ = The current state of the WebSocket connection. Notifies about state changes:  [WebSocket.readyState](https://developer.mozilla.org/en/docs/Web/API/WebSocket#Ready_state_constants)
* __last-request__ = The most recent request made by this web-socket element.
* __last-response__ = The most recent response received by this web-socket element.
* __last-error__ = The most recent error received by this web-socket element. If any error occurred.
* __verbose__ = Enables verbose mode

Events:

* __onError__ = Sends an event when the socket returns an error
* __onMessage__ = Sends an event when a new frame is received from the socket
* __onOpen__ = When the connection is established
* __onClose__ = When the connection is closed
