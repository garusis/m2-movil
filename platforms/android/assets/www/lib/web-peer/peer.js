(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/*jshint maxlen: 1000*/
/*global FileReader*/
(function (window) {

    var EventEmitter = require('events').EventEmitter;
    var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    var requestFileSystem = window.requestFileSystem ||  window.webkitRequestFileSystem || window.mozRequestFileSystem;
    var MAX_CHUNK_SIZE = 152400,
        RETRY_INTERVAL = 300,
        STATUS_NEW = 'new',
        STATUS_START = 'started',
        STATUS_END = 'finished';

    var peerServer = {
        iceServers: [
            {url: 'stun:23.21.150.121'},
            {url: 'stun:stun.l.google.com:19302'},
            {url: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}
        ]
    };

    var peerOptions = {
        optional: [
            {DtlsSrtpKeyAgreement: true}
        ]
    };

    var channelOptions = {
        reliable: true
    };


    var constraints = {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    /**
     * Creating empty file that can be filled with chunks
     *
     * @constructor
     * @param {Object} options
     * @param {Number} options.size
     * @param {String} options.name
     * @param {String} options.type
     */
    function FileStream(options) {
        this._loaded = 0;
        this._chunks = [];
        this._size = options.size;
        this._type = options.type;
        this.name = options.name;
        EventEmitter.call(this);
    }

    FileStream.prototype = Object.create(EventEmitter.prototype);
    FileStream.prototype.constructor = FileStream;

    /**
     * Adding chunk to buffer
     *
     * @param {ArrayBuffer} buff
     */
    FileStream.prototype.append = function (buff) {
        this._chunks.push(buff);
        this._loaded += buff.byteLength || buff.size;
        this.emit('progress', this._loaded / this._size);
        if (this._loaded >= this._size) {
            this._createUrl();
        }
        return this;
    };

    /**
     * Starting load file
     */
    FileStream.prototype.load = function () {
        return this.emit('start');
    };


    Object.defineProperty(FileStream.prototype, 'url', {
        get: function () {
            if (!this._url) {
                throw new Error('.url is not avaliable until file loads');
            }
            return this._url;
        }
    });

    FileStream.prototype._createUrl = function () {
        var blob = this.getBlob(),
            onError = this.emit.bind(this, 'error'),
            _this = this;

        if (!requestFileSystem) {
            this._url = URL.createObjectURL(blob);
            _this.emit('url', this._url);
            _this.emit('load');
            return;
        }

        requestFileSystem(window.TEMPORARY, blob.size, function (fs) {
            fs.root.getFile(_this.name, {create: true}, function (fileEntry) {

                _this._url = fileEntry.toURL();
                _this.emit('url', _this._url);
                fileEntry.createWriter(function (writer) {
                    writer.onerror = onError;
                    writer.onwriteend = function () {
                        _this.emit('load');
                    };
                    writer.write(blob);
                }, onError);

            }, onError);
        }, onError);
    };

    /**
     * Getting blob from stream
     *
     * @return {Blob} file
     */
    FileStream.prototype.getBlob = function () {
        return new Blob(this._chunks, {type: this._type});
    };


    /**
     * WebRTC peer connection wrapper
     * @constructor
     */
    function Peer() {
        this._messagePull = [];
        this._iceCandidate = null;
        this._files = {
            received: {},
            sent: {}
        };
        this._createConnection();
        this.messages = new EventEmitter();
        EventEmitter.call(this);
    }

    Peer.prototype = Object.create(EventEmitter.prototype);
    Peer.prototype.constructor = Peer;

    Peer.prototype._createConnection = function () {
        var _this = this,
            pc;

        try {
            pc = new PeerConnection(peerServer, peerOptions);
        } catch(e) {
            return this.emit('error', e);
        }
        this._pc = pc;
        this._channel = null;

        pc.onicecandidate = function (e) {
            if (e.candidate === null) {
                return;
            }
            pc.onicecandidate = null;
            _this.emit('sync', {candidate: e.candidate});
        };
        pc.onaddstream  = function (data) {
            if (data.stream.id !== 'default') {
                _this.emit('stream', data.stream);
            }
        };
        pc.ondatachannel = function (e) {
            var channel = e.channel;
            _this._channel = channel;
            channel.onmessage = _this._onChannelMessage.bind(_this);
        };
        pc.oniceconnectionstatechange = function (e) {
            if (pc.iceConnectionState == 'disconnected') {
                _this.emit('disconnect');
                _this._createConnection();
            }
        };

    };


    /**
     * Create offer with current state of connection
     */
    Peer.prototype._createOffer = function () {
        var _this = this;

        this._pc.createOffer(
            function (offer) {
                _this._pc.setLocalDescription(offer);
                _this.emit('sync', {offer: offer});
            },
            this.emit.bind(this, 'error'),
            constraints
        );

        return this;
    };

    /**
     * Reopen connection
     * @param {Object} settings same to .sync()
     */
    Peer.prototype._renew = function (settings) {
        var streams = this._pc.getLocalStreams();
        this._pc.close();
        this._createConnection();

        streams.forEach(function (stream) {
            this._pc.addStream(stream);
        }, this);

        this.sync(settings);
        this._pc.addIceCandidate(new RTCIceCandidate(this._iceCandidate));
        this.emit('reconnect');
    };

    /**
     * Sync with another peer
     *
     * @param {String|Object} opts
     * @param {Object} [opts.offer] of another peer
     * @param {Object} [opts.candidate] new ice candidate
     * @param {Object} [opts.answer] of answer peer
     */
    Peer.prototype.sync = function (opts) {
        var settings = 'object' === typeof opts ? opts : JSON.parse(opts),
            pc = this._pc,
            _this = this;

        if (settings.offer) {
            pc.setRemoteDescription(new SessionDescription(settings.offer), function () {
                pc.createAnswer(
                    function (answer) {
                        pc.setLocalDescription(answer);
                        _this.emit('sync', {answer: answer});
                    },
                    _this.emit.bind(_this, 'error'),
                    constraints
                );

            }, function () {
                _this._renew(settings);
            });
        }

        if (settings.candidate) {
            this._iceCandidate = settings.candidate;
            this._pc.addIceCandidate(new RTCIceCandidate(settings.candidate));
        }

        if (settings.answer) {
            this._pc.setRemoteDescription(new SessionDescription(settings.answer));
        }

    };

    /**
     * Create data channel
     */
    Peer.prototype._createChannel = function () {
        var _this = this,
            channel = this._pc.createDataChannel('myLabel', channelOptions);

        channel.onopen = function () {
            channel.binaryType = 'arraybuffer';
            _this._tryToSendMessages();
        };

        channel.onerror = this.emit.bind(this, 'error');

        channel.onmessage = this._onChannelMessage.bind(this);

        this._channel = channel;
        this._createOffer();
    };

    function readFileAsStream(file, onProgress, onDone) {
        var reader = new FileReader(),
            loaddedBefore = 0;

        reader.readAsArrayBuffer(file);
        reader.onprogress = function (e) {
            if (!reader.result) {
                return;
            }

            var loaded = e.loaded,
                chunk, index;

            for (index = loaddedBefore; index < loaded; index += MAX_CHUNK_SIZE) {
                chunk = reader.result.slice(index, index + MAX_CHUNK_SIZE);
                onProgress(chunk);
            }

            loaddedBefore = e.loaded;
        };

        reader.onloadend = function () {

            var loaded = reader.result.byteLength,
                index, chunk;

            for (index = loaddedBefore; index < loaded; index += MAX_CHUNK_SIZE) {
                chunk = reader.result.slice(index, index + MAX_CHUNK_SIZE);
                onProgress(chunk);
            }

            onDone();
        };
    }

    Peer.prototype._sendFile = function (id) {
        var file = this._files.sent[id],
            _this = this;

        readFileAsStream(
            file,
            this._send.bind(this),
            function () {
                _this._send({
                    file: id,
                    status: STATUS_END
                });
            }
        );
    };

    /**
     * Data channel message handler
     */
    Peer.prototype._onChannelMessage = function (e) {
        var data = e.data,
            _this = this,
            file;

        if (data instanceof ArrayBuffer || data instanceof Blob) {
            return this._lastFile.append(data);
        }

        data = JSON.parse(data);

        if (data.message) {
            return this.messages.emit(data.message, data.data);
        }
        if (data.file) {
            switch (data.status) {
                case STATUS_NEW:
                    file = new FileStream(data);
                    file.on('start', function () {
                        _this._send({
                            file: data.file,
                            status: STATUS_START
                        });
                    });
                    this.emit('file', file);
                    this._lastFile = this._files.received[data.file] = file;
                    break;

                case STATUS_START:
                    this._sendFile(data.file);
                    break;

                case STATUS_END:
                    this.emit('file load', this._lastFile.getBlob());
                    break;
            }

        }

    };

    /**
     * Add media stream
     *
     * @param {MediaStream} stream
     */
    Peer.prototype.addStream = function (stream) {
        this._pc.addStream(stream);
        this._createOffer();
    };

    /**
     * Sending json or ArrayBuffer to peer
     * @private
     *
     * @param {ArrayBuffer|Object} message
     */
    Peer.prototype._send = function (message) {
        if (!this._channel) {
            this._createChannel();
        }

        message = message instanceof ArrayBuffer ? message : JSON.stringify(message);

        this._messagePull.push(message);

        if ('open' === this._channel.readyState) {
            this._tryToSendMessages();
        }
    };

    /**
     * Send data to peer
     * @param {String} name
     * @param {Mixed} data
     */
    Peer.prototype.send = function (name, data) {
        this._send({
            message: name,
            data: data
        });
        return this;
    };

    Peer.prototype._tryToSendMessages = function (isRetry) {
        var pull = this._messagePull,
            message;

        if (!isRetry && this._messageRetryTimer) {
            return;
        }

        if (this._messageRetryTimer) {
            clearTimeout(this._messageRetryTimer);
            this._messageRetryTimer = null;
        }

        while((message = pull.shift())) {
            try {
                this._channel.send(message);
            } catch(e) {
                message.id = Math.random();
                pull.unshift(message);
                this._messageRetryTimer = setTimeout(this._tryToSendMessages.bind(this, true), RETRY_INTERVAL);
                this.emit('error', e);
                break;
            }
        }
    };

    /**
     * Send file to peer
     *
     * @param {File} file
     */
    Peer.prototype.sendFile = function (file) {
        var id = Date.now() + Math.random();
        this._files.sent[id] = file;
        this._send({
            file: id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: STATUS_NEW
        });
    };

    /**
     * Close connection
     */
    Peer.prototype.close = function () {
        this._pc.close();
        this.emit('close');
        this.removeAllListeners();
    };

    /*global define*/
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Peer;
        window.Peer = Peer;
    } else if (typeof define === 'function' && define.amd) {
        define(Peer);
        window.Peer = Peer;
    } else {
        window.Peer = Peer;
    }

}(window));
},{"events":1}]},{},[2]);
