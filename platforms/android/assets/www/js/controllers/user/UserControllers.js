angular.module('makclaus')
  .controller('LoginController', [
    '$scope', '$state', '$auth', '$localStorage', 'originsManager', 'SatellizerConfig', 'jgSimpleQueries',
    function ($scope, $state, $auth, $localStorage, originsManager, SatellizerConfig, jgSimpleQueries) {
      var controller = this;
      $scope.login = {
        direccion: $localStorage["origins.base"]
      };
      this.login = function (dataLogin) {
        $localStorage["origins.base"] = dataLogin.direccion;
        originsManager.setOrigin("base", $localStorage["origins.base"]);
        originsManager.setOrigin("socket.io", originsManager.getOrigin("base"));
        originsManager.setOrigin("images", originsManager.getOrigin("base"));
        originsManager.setOrigin("origin", originsManager.getOrigin("base") + "/admin");

        jgSimpleQueries.config({base_url: originsManager.getOrigin()});
        SatellizerConfig.loginUrl = originsManager.getOrigin() + "/users/login";

        $localStorage["user.identificador"] = dataLogin.identificador;

        return $auth
          .login({identificador: dataLogin.identificador, password: dataLogin.password})
          .then(function (response) {
            $localStorage.userRoles = _.map(response.data.roles, "name");
            $localStorage.userStates = _.map(response.data.states, "states");
            $scope.$emit("mix2::redirectDefault");
          }).catch(function (response) {
            alert('Identificación o Contraseña incorrecta');
            //$scope.formLogin.username.$error.login = true;
          });
      };
    }
  ]);
