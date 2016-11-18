angular.module('makclaus', [
  'ionic', 'satellizer', 'jg.originsManager', 'jgQueries', 'ngStorage', 'toastr', 'ionic-fancy-select', 'checklist-model'
])
  .run(["$ionicPlatform", "$rootScope", "$state", "$auth", "$localStorage", function ($ionicPlatform, $rootScope, $state, $auth, $localStorage) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });

    $rootScope.cerrarSesion = function () {
      $auth.logout();
      delete $localStorage.userRoles;
      delete $localStorage.userStates;
      $state.go("login");
    };

    $rootScope.goBack = function (stateName) {
      $state.go(stateName || 'dashboard');
    };

    $rootScope.$on("mix2::redirectDefault", function () {
      if (!$auth.isAuthenticated()) {
        $state.go("login");
      } else if ($localStorage.userRoles.indexOf("administrativo") > -1) {
        $state.go("streaming");
      } else {
        $state.go("dashboard");
      }
    });

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {

      //validar si tiene permiso para este toState.
      /*
       if(!permisoValido){
       event.preventDefault();
       }
       */
      //TEMPORAL:
      if (toState.name != "login" && !$auth.isAuthenticated()) {
        event.preventDefault();
        $state.go("login");
      }
    });
  }])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('login', {
        url: "/login",
        templateUrl: "admin/html/login.html",
        controller: "LoginController",
        controllerAs: "lgCtrl"
      })
      .state('dashboard', {
        url: "/dashboard",
        templateUrl: "admin/html/home/dashboard/pending.html",
        controller: "DashboardPendingController",
        controllerAs: "dashController"
      })
      .state('pollsSolve', {
        url: "/polls/solve/:id-{name}",
        templateUrl: "admin/html/home/poll/pollSolve.html",
        controller: "PollSolveController"
      })
      .state('testsSolve', {
        url: "/tests/solve/:id-{name}",
        templateUrl: "admin/html/home/test/testSolve.html",
        controller: "TestSolveController"
      })
      .state('streaming', {
        url: "/streaming",
        templateUrl: "admin/html/home/streaming/streaming.html",
        controller: "PreStreamingController",
        controllerAs: 'streamCtrl'
      })
      .state('streamingOnline', {
        url: "/online",
        templateUrl: "admin/html/home/streaming/onlinestreaming.html",
        controller: "StreamingController",
        controllerAs: 'streamCtrl',
        params: {
          streamingConfig: null
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise(function ($injector) {
      $injector.invoke(["$rootScope", function ($rootScope) {
        $rootScope.$emit("mix2::redirectDefault");
      }]);
    });
  })
  .config(['$localStorageProvider', function ($localStorageProvider) {
    $localStorageProvider.setKeyPrefix('mix2.data.');
  }])
  .config(["originsManagerProvider", "$localStorageProvider", function (originsManagerProvider, $localStorageProvider) {
    originsManagerProvider.config();
    if (!$localStorageProvider.get("origins.base")) {
      $localStorageProvider.set("origins.base", 'https://mix2local.co:3432');
    }

    originsManagerProvider.setOrigin("base", $localStorageProvider.get("origins.base"));
    originsManagerProvider.setOrigin("socket.io", originsManagerProvider.getOrigin("base"));
    originsManagerProvider.setOrigin("images", originsManagerProvider.getOrigin("base"));
    originsManagerProvider.setOrigin("origin", originsManagerProvider.getOrigin("base") + "/admin");
  }])
  .config(["jgSimpleQueriesProvider", "originsManagerProvider", function (jgSimpleQueriesProvider, originsManagerProvider) {
    jgSimpleQueriesProvider.config({base_url: originsManagerProvider.getOrigin()});
  }])
  .config(["$authProvider", "originsManagerProvider", function ($authProvider, originsManagerProvider) {
    $authProvider.loginUrl = originsManagerProvider.getOrigin() + "/users/login";
    $authProvider.tokenName = "key";
    $authProvider.tokenPrefix = "mix2.credentials.user";
    $authProvider.loginRedirect = null;
  }]);
