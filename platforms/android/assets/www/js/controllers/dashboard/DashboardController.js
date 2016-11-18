angular.module('makclaus')

  .controller("DashboardPendingController",
  ["$scope", "$state", "PollService", "TestService",
    function ($scope, $state, PollService, TestService) {
      var controller = this;
      $scope.pendingPolls = [];
      $scope.pendingTests = [];

      $scope.loadPendings = function () {
        PollService.listPendings().then(function (response) {
          $scope.pendingPolls = response.data;
        }).catch(function () {
          console.error(arguments);
        });

        TestService.listPendings().then(function (response) {
          $scope.pendingTests = response.data;
        }).catch(function () {
          console.error(arguments);
        });
      };

      $scope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
        if (toState.name == "dashboard") {
          $scope.loadPendings();
        }
      });
    }
  ]);
