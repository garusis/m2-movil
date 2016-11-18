/**
 * Created by Admin on 08/10/2015.
 */
angular.module("makclaus")
  .controller("TestSolveController",
  ["$scope", "$state", "TestService", "$stateParams", "TestAnswerService", "TestQuestionService",  "$localStorage", "toastr", "$interval","$filter","$ionicSlideBoxDelegate",
    function ($scope, $state, TestService, $stateParams, TestAnswerService, TestQuestionService, $localStorage, toastr, $interval,$filter, $ionicSlideBoxDelegate) {
      if (!$stateParams.id) {
        return $state.go('dashboard');
      }
      $scope.animations = {
        finishLoader: false,
        initLoader: false,
        editName: false,
        currentAnimation: {},
        disableButton: false
      };
      $scope.objects = {currentTest: null};

      $scope.openImageModal = function (images, index) {
        Lightbox.openModal(images, index);
      };

      $scope.goBack = function(stateName){
        $state.go('dashboard');
      };

      $scope.nextSlide = function() {
        $ionicSlideBoxDelegate.next();
      }

      var statusInterval;

      $scope.$on("$stateChangeStart", function () {
        $interval.cancel(statusInterval);
      });

      var showMessage = function (message, title, type) {
        toastr[type](message, title);
      };

      var loadTest = function () {
        TestService
          .getSolved($stateParams.id)
          .then(function (result) {
            var test = $scope.objects.currentTest = result.data;
            if (test.status != 'active') {
              alert('No tiene permitido acceder a este test en este momento.', 'Error');
              $scope.objects.currentTest = {};
              return $state.go('dashboard');
            }
            $ionicSlideBoxDelegate.update();
            test.questions = _.shuffle(test.questions);
            var storedTest = $localStorage["test." + test.id];
            if (storedTest) {
              var questions = _.indexBy(test.questions, "id");
              _.forEach(storedTest.questions, function (question) {
                questions[question.id].selectedAnswers = question.selectedAnswers;
              });
            }

            $scope.objects.currentTest.eta = Date.now() + $scope.objects.currentTest.eta;

            $interval.cancel(statusInterval);
            statusInterval = $interval(function () {
              TestService
                .getStatus($scope.objects.currentTest.id)
                .then(function (response) {
                  $scope.objects.currentTest.eta = Date.now() + response.data.eta;

                  switch (response.data.status) {
                    case "active" :
                      return;
                    case "prefinished":
                      showMessage('Este Test ha Finalizado. Tus respuestas estan siendo enviadas.', 'Información', 'info');
                      return $scope.sendSolve();
                      break;
                    case "paused":
                      return showMessage('Este Test ha sido Pausado y no podras continuar respondiendolo hasta que nuevamente sea habilitado.', 'Información', 'info');
                    case "finished":
                      return showMessage('Este Test ha finalizado. En caso de no recibir el mensaje confirmando el envio de tus respuestas, contacta con tu profesor.', 'Error', 'warning');
                    case "closed":
                    default:
                      return showMessage('Este Test ha dejado de ser accesible.', 'Error', 'error');

                  }
                });
            }, 10000);


            $scope.$watch(function () {
              var test = $scope.objects.currentTest;
              return test ? JSON.stringify(test.questions) : null;
            }, function (newValue) {
              var test = $scope.objects.currentTest;
              if (newValue !== null) {
                $localStorage["test." + test.id] = test;
              }
            });

          }).catch(function (error) {
            console.log(error);
          });
      };

      $scope.sendSolve = function () {
        $scope.animations.disableButton = true;
        var test = {
          id: $scope.objects.currentTest.id,
          questions: _.map($scope.objects.currentTest.questions, function (question) {
            return {
              id: question.id,
              selectedAnswers: _.isArray(question.selectedAnswers) ? question.selectedAnswers : [question.selectedAnswers]
            };
          })
        };

        return TestService
          .solve(test)
          .then(function () {
            delete $localStorage["test." + test.id];
            showMessage('Sus respuestas se han enviado adecuadamente', 'Información', 'info');
            $state.go("dashboard");
            return test;
          }).catch(function () {
            alert('Un error interno ha ocurrido. Sus respuestas se han guardado pero no han podido ser enviadas. Por favor intente mas tarde nuevamente.', 'Error');
          }).finally(function () {
            $scope.animations.disableButton = false;
          });
      };
      loadTest();
    }])
  .controller("ModalTestController", ["$scope", "$modalInstance", "TestService", "classtype",
    function ($scope, $modalInstance, TestService, classtype) {
      $scope.test = {};
      $scope.materias = [];

      classtype
        .getList()
        .then(function (response) {
          $scope.materias = response.data;
        });

      this.saveNewTest = function (test) {
        var promise = TestService.create(test);
        promise.then(function (result) {
          $modalInstance.close(result);
        });
        return promise;
      };
      $scope.dismiss = function () {
        $modalInstance.dismiss('cancel');
      };
    }])
  .controller("ModalTestApplyController", ["$scope", "$modalInstance", "TestService", "test", "grupoClases", "users", "toastr",
    function ($scope, $modalInstance, TestService, test, grupoClases, users, toastr) {
      $scope.hours = [{"data": 0}, {"data": 1}, {"data": 2}, {"data": 3}, {"data": 4}, {"data": 5}, {"data": 6}, {"data": 7}, {"data": 8}, {"data": 9}, {"data": 10}, {"data": 11}, {"data": 12}, {"data": 13}, {"data": 14}, {"data": 15}, {"data": 16}, {"data": 17}, {"data": 18}, {"data": 19}, {"data": 20}, {"data": 21}, {"data": 22}, {"data": 23}, {"data": 24}];
      $scope.minutes = [{"data": 0}, {"data": 1}, {"data": 2}, {"data": 3}, {"data": 4}, {"data": 5}, {"data": 6}, {"data": 7}, {"data": 8}, {"data": 9}, {"data": 10}, {"data": 11}, {"data": 12}, {"data": 13}, {"data": 14}, {"data": 15}, {"data": 16}, {"data": 17}, {"data": 18}, {"data": 19}, {"data": 20}, {"data": 21}, {"data": 22}, {"data": 23}, {"data": 24}, {"data": 25}, {"data": 26}, {"data": 27}, {"data": 28}, {"data": 29}, {"data": 30}, {"data": 31}, {"data": 32}, {"data": 33}, {"data": 34}, {"data": 35}, {"data": 36}, {"data": 37}, {"data": 38}, {"data": 39}, {"data": 40}, {"data": 41}, {"data": 42}, {"data": 43}, {"data": 44}, {"data": 45}, {"data": 46}, {"data": 47}, {"data": 48}, {"data": 49}, {"data": 50}, {"data": 51}, {"data": 52}, {"data": 53}, {"data": 54}, {"data": 55}, {"data": 56}, {"data": 57}, {"data": 58}, {"data": 59}, {"data": 60}];
      $scope.testApply = {test: test.id, leftHours: $scope.hours[1], leftMinutes: $scope.minutes[0]};
      this.applyTest = function () {
        try {
          $scope.testApply.eta = moment.duration({
            hours: $scope.testApply.leftHours.data,
            minutes: $scope.testApply.leftMinutes.data
          })._milliseconds;
        } catch (err) {
          $scope.formTestApply.hours.$setValidity("required", false);
        }

        return TestService
          .apply($scope.testApply)
          .then(function (result) {
            $modalInstance.close(result);
          })
          .catch(function (response) {
            if (response.status === 406) {
              var invalidFields = response.data;
              _.forEach(invalidFields, function (errors, field) {
                _.forEach(errors, function (error) {
                  $scope.formTestApply[field].$setValidity(error.rule, false);
                });
              });
            } else {
              toastr.error('Un error interno ha ocurrido y no se ha podido crear el usuario.', 'Error');
              console.log("error", response.data);
            }
          });
      };
      $scope.dismiss = function () {
        $modalInstance.dismiss('cancel');
      };
      $scope.gruposClases = [];
      grupoClases.getList({}).then(function (res) {
        $scope.gruposClases = res.data;
      });
      $scope.usuarios = [];
      users.getList({}).then(function (res) {
        $scope.usuarios = res.data;
      });
    }])
  .directive("ngAutoWidth", function () {
    return {
      link: function (scope, element, attrs) {
        scope.$watch(attrs.ngAutoWidth, function (newValue) {
          if (newValue) {
            //if(newValue.length <20){
            element.css("width", ((newValue.length + 1) * 16.5) + "px");
            //}else{
            //    element.css("width",(newValue.length * 11.63)+"px");
            //}
          }
        });
      }
    };
  })
  .directive("ngClickFocus", function () {
    return {
      priority: 0,
      link: function (scope, element, attrs) {
        var selector = attrs.ngClickFocus;

        var resultEval = scope.$eval(selector);
        _.forEach(resultEval, function (value, key) {
          scope.$watch(value, function (newValue) {
            if (newValue) {
              var $elem = $(key).focus();
              setTimeout(function () {
                $elem = $elem.get(0);
                $elem.selectionStart = 0;
                $elem.selectionEnd = 0;
              }, 0);
            }
          });
        });
      }
    };
  });
