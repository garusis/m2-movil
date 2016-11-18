/**
 * Created by Marcos J on 11/08/2015.
 * @author Marcos J. Alvarez
 * @email marcosalvarez@kubesoft.com
 * @version 0.0.1
 */
angular
  .module('makclaus')
  .controller('PreStreamingController', ['$scope', '$state', 'streaming', 'devices', function ($scope, $state, streaming, devices) {


    var originalFiles = {}, originalDevices = {};

    $scope.availableFiles = {};
    $scope.devices = [];
    var dataStreamingDefault = {
      name: "",
      description: "",
      file: null,
      devices: [],
      streamVideo: true,
      streamAudio: true
    };

    $scope.reset = function () {
      $scope.dataStreaming = angular.copy(dataStreamingDefault);
      $scope.formStreaming.$setPristine();
    };

    this.start = function () {
      var dataStreaming = angular.copy($scope.dataStreaming);
      var files = [];
      if (originalFiles[dataStreaming.file]) {
        files.push(originalFiles[dataStreaming.file].nombre);
      }
      var devicesList = [];
      _.forEach($scope.devices, function (device) {
        if (device.checked) {
          devicesList.push(originalDevices[device.id].identificador);
        }
      });

      dataStreaming.files = files;
      dataStreaming.devices = devicesList;
      $state.go("streamingOnline", {
        streamingConfig: dataStreaming
      });
    };

    var load = function () {
      $scope.dataStreaming = angular.copy(dataStreamingDefault);
      streaming.getAvailableFiles().then(function (data) {
        originalFiles = {};
        $scope.availableFiles = _.map(data.data, function (file) {
          originalFiles[file.id] = file;
          return {
            id: file.id, text: file.nombre, checked: false
          };
        });
      }, function () {
      });

      devices.getList({}).then(function (list) {
        originalDevices = {};
        $scope.devices = _.map(list.data, function (device) {
          originalDevices[device.id] = device;
          return {
            id: device.id, text: device.identificador, checked: false
          };
        });
      });
    };
    load();
  }])
  .controller('StreamingController', ['$scope', '$state', '$stateParams', 'streaming', '$ionicSlideBoxDelegate',
    function ($scope, $state, $stateParams, streaming, $ionicSlideBoxDelegate) {
      var controller = this;
      $scope.changePage = function (index) {
        console.log(index);
        $scope.currentStreaming.file.currentPage = index;
        streaming.changePageFile(index);
      };

      var eventStateChangeSuccess = $scope.$on("$stateChangeSuccess", function () {
        if (!$stateParams.streamingConfig && !$stateParams.recoverConnection) {
          eventStateChangeSuccess();
          $state.go("streaming");
          return;
        }

        var promise = streaming.prepareSocket();
        if ($stateParams.streamingConfig) {
          promise = promise
            .then(function () {
              return streaming.endCurrentStreaming();
            })
            .then(function () {
              return streaming.start($stateParams.streamingConfig);
            });
        } else {
          promise = promise.then(function () {
            return streaming.getCurrentStreaming();
          });
        }
        promise
          .then(function (data) {
            $scope.currentStreaming = data;
            $ionicSlideBoxDelegate.update();
            $scope.mediaStreaming = false;

            if (data.streamAudio || data.streamVideo) {
              $scope.mediaStreaming = true;
              var constrains = {};
              if (data.streamAudio) {
                constrains.audio = true;
              }
              if (data.streamVideo) {
                constrains.video = true;
              }
              return streaming
                .startMediaStreaming(constrains)
                .then(function (dataMediaStreaming) {
                  $scope.mediaStreaming = dataMediaStreaming;
                  $("#targetVideo").attr("src", dataMediaStreaming.src).get(0).play();
                });
            }
          })
          .catch(function () {
            eventStateChangeSuccess();
            $state.go("streaming");
          });
      });

      $scope.$on("$stateChangeStart", function () {
        controller.endStreaming();
      });

      this.endStreaming = function () {
        $("#targetVideo").get(0).pause();
        $("#targetVideo").attr("src", null);
        eventStateChangeSuccess();
        streaming.endStreaming().then(function () {
          $scope.currentStreaming = null;
          $scope.mediaStreaming = false;
          $state.go("streaming");
        })
          .catch(function (err) {
            console.error(err);
          });
      };
    }])


  .factory("devices", ['jgSimpleQueries', '$q', function (jgSimpleQueries, $q) {
    return {
      getList: function (query) {
        return jgSimpleQueries.executeRequest("GET", "/devices/list", query);
      },
      create: function (device) {
        return jgSimpleQueries.executeRequest("POST", "/devices/create", {device: device});
      }
    };
  }])
  .service("userMedia", function () {
    var getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia).bind(navigator);
    return {
      getUserMedia: function (constrains, cb, errCb) {
        getMedia(constrains, cb, errCb);
      }
    }
  })
  .factory("socket", ['$rootScope', 'userMedia', '$q', 'originsManager', function ($rootScope, userMedia, $q, originsManager) {
    var socket;
    var service = {
      connect: function () {
        var deferred = $q.defer();
        var _socket = io.connect(originsManager.getOrigin("socket.io"), {
          'forceNew': true,
          query: "identity=admin"
        });
        _socket.once("connect", function () {
          $rootScope.$apply(function () {
            socket = _socket;
            _socket.off("connect_error");
            deferred.resolve();
          });
        });
        _socket.once("connect_error", function (err) {
          console.error("Socket Connect Error");
          console.error(err.stack);
          $rootScope.$apply(function () {
            _socket.off();
            _socket = null;
            deferred.reject();
          });
        });
        return deferred.promise;
      },
      on: function (eventName, callback) {
        if (!socket) {
          return;
        }
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      once: function (eventName, callback) {
        if (!socket) {
          return;
        }
        socket.once(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        if (!socket) {
          return;
        }
        callback = callback || angular.noop;
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      },
      off: function () {
        if (!socket) {
          return;
        }
        socket.off.apply(socket, arguments);
      },
      disconnect: function () {
        if (!socket) {
          return;
        }
        socket.disconnect();
        socket = null;
      }
    };
    //agregar todo lo necesario para validar si ya se conecto o no.
    return service;
  }])
  .factory("streaming", ['socket', 'jgSimpleQueries', '$q', 'userMedia', function (socket, jgSimpleQueries, $q, userMedia) {

    var events = [];

    var service = {
      prepareSocket: function () {
        return socket.connect();
      },
      endStreaming: function () {
        var promise = service.endCurrentStreaming();
        promise.then(function () {
          socket.disconnect();
        });
        return promise;
      },
      endCurrentStreaming: function () {
        var deferred = $q.defer();
        socket.once("streaming:currentEnded", function () {
          socket.off();
          deferred.resolve();
        });
        socket.emit("streaming:endCurrent");
        $.each(events, function (index, descriptor) {
          descriptor.element.off(descriptor.type, descriptor.handler);
        });
        return deferred.promise;
      },
      start: function (dataStreaming) {
        var deferred = $q.defer();
        socket.once("streaming:started", function (data) {
          socket.off("streaming:noStarted");
          deferred.resolve(data);
        });
        socket.once("streaming:noStarted", function () {
          socket.off("streaming:started");
          deferred.reject();
        });
        socket.emit("streaming:start", dataStreaming);
        //Primero el admin debe tener listo el flujo del streaming y enviar un mensaje indicando que ya esta listo para recibir peers.
        //Luego, el mensaje es propagado a los posibles peers y estos solicitan sincronizacion por medio de su propio room.
        return deferred.promise;
      },
      startScreenStreaming: function (data) {
        var $element = $(data.element);
        var deferred = $q.defer();
        socket.emit("streaming:startScreen", data);
        $(document).scrollTop($element.offset().top - 68);

        var scrollHandler = function () {
          socket.emit("screen:scroll", {
            top: $(document).scrollTop() - ($element.offset().top - 68)
          });
        };
        $(document).scroll(scrollHandler);
        events.push({element: $(document), type: "scroll", handler: scrollHandler});
        console.log(data);
        deferred.resolve(data);
        return deferred.promise;
      },
      startMediaStreaming: function (constrains) {
        var deferred = $q.defer();
        var mediaStreaming = {};
        var devices = {};
        userMedia.getUserMedia(constrains, function (stream) {
          mediaStreaming.originalStream = stream;
          //mediaStreaming.src = (window.URL || window.webkitURL).createObjectURL(stream);
          mediaStreaming.src = URL.createObjectURL(stream);
          socket.on("peer:register", function (data) {
            var peer = new Peer();
            var dataDevice = devices[data.idDevice] = {
              idDevice: data.idDevice,
              peer: peer,
              stream: mediaStreaming.originalStream.clone()
            };

            peer.on("error", function () {
              console.log(arguments);
            });

            peer.on("sync", function (data) {
              socket.emit("peer:sync", {
                idDevice: dataDevice.idDevice,
                data: data
              });
            });
            peer.addStream(dataDevice.stream);
            //agregar los metodos de sync, hacer el respectivo clone de MediaStream y aÃ±adirlo al peer
          });

          socket.on("peer:sync", function (data) {
            devices[data.idDevice].peer.sync(data.data);
          });

          socket.on("peer:unregister", function (data) {
            //data:{identity:'m1'}
          });
          socket.emit("peer:readyForRegister");

          socket.once("streaming:currentEnded", function () {
            var stopStreaming = function (stream) {
              try {
                stream.active = false;
              } catch (err) {
              }
              try {
                stream.stop();
              } catch (err) {
              }
              if (stream.getVideoTracks) {
                // get video track to call stop on it
                var tracks = stream.getVideoTracks();
                if (tracks) {
                  _.forEach(tracks, function (track) {
                    track.stop && track.stop();
                  });
                }
              }
            };
            stopStreaming(mediaStreaming.originalStream);
            _.forEach(devices, function (device) {
              stopStreaming(device.stream);
            });
          });

          deferred.resolve(mediaStreaming);
        }, function () {
          console.error(arguments);
          deferred.reject();
        });
        return deferred.promise;
      },
      getCurrentStreaming: function () {
        //pendiente implementacion para recuperar el actual streaming en
        //caso de desconexion del socket
      },
      changePageFile: function (page) {
        socket.emit("file:text:changePage", {page: page});
      },
      sendText: function (text) {
        socket.emit("liveText:change", {text: text});
      },
      openModal: function (images, index) {
        socket.emit("modal:open", {
          images: images,
          index: index
        });
      },
      closeModal: function () {
        socket.emit("modal:close");
      },
      getAvailableFiles: function () {
        return jgSimpleQueries.executeRequest("GET", "files/list");
      }
    };
    return service;
  }]);
