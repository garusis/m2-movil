/**
 * Created by Admin on 08/10/2015.
 */
angular.module("makclaus")
  .controller("PollSolveController",
  ["$scope", "$state", "PollService", "$stateParams", "AnswerService", "QuestionService", "$localStorage", "toastr", "$ionicSlideBoxDelegate",
    function ($scope, $state, PollService, $stateParams, AnswerService, QuestionService, $localStorage, toastr, $ionicSlideBoxDelegate) {
      if (!$stateParams.id) {
        return $state('dashboard');
      }
      $scope.animations = {
        finishLoader: false,
        initLoader: false,
        editName: false,
        currentAnimation: {},
        disableButton: false
      };
      $scope.objects = {currentPoll: null};

      $scope.nextSlide = function () {
        $ionicSlideBoxDelegate.next();
      };

      $scope.evalUpdatePoll = function () {
        if ($scope.animations.editName) {
          $scope.animations.currentAnimation.sender = true;
          PollService.update({
            name: $scope.objects.currentPoll.name,
            id: $stateParams.id
          }).then(function (result) {
            $scope.animations.currentAnimation = {};
            $scope.animations.editName = !$scope.animations.editName;
          }).catch(function (error) {
            $scope.animations.currentAnimation = {};
          });
        } else {
          $scope.animations.editName = !$scope.animations.editName;
        }
      };

      $scope.openImageModal = function (images, index) {
        Lightbox.openModal(images, index);
      };

      var loadPoll = function () {
        PollService.getAplicated($stateParams.id).then(function (result) {
          var poll = $scope.objects.currentPoll = result.data;
          var storedPoll = $localStorage["poll." + poll.id];
          if (storedPoll) {
            var questions = _.indexBy(poll.questions, "id");
            _.forEach(storedPoll.questions, function (question) {
              questions[question.id].selectedAnswer = question.selectedAnswer;
            });
          }

          $ionicSlideBoxDelegate.update();

          $scope.$watch(function () {
            var poll = $scope.objects.currentPoll;
            return poll ? JSON.stringify(poll) : null;
          }, function (newValue) {
            var poll = $scope.objects.currentPoll;
            if (newValue !== null) {
              $localStorage["poll." + poll.id] = poll;
            }
          });
        }).catch(function (error) {
          console.log(error);
        });
      };

      $scope.sendSolve = function () {
        $scope.animations.disableButton = true;
        PollService
          .solve($scope.objects.currentPoll)
          .then(function () {
            delete $localStorage["poll." + $scope.objects.currentPoll.id];
            toastr.success('Sus respuestas se han enviado adecuadamente');
            $state.go("dashboard");
          }).catch(function () {
          toastr.error('Un error interno ha ocurrido. Sus respuestas se han guardado pero no han podido ser enviadas. Por favor intente mas tarde nuevamente.', 'Error');
          }).finally(function () {
            $scope.animations.disableButton = false;
          });
      };
      loadPoll();
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
