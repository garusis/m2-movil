/**
 * Created by Marcos J. Alvarez on 09/08/2015.
 * @author Marcos J. Alvarez
 * @email garusis@gmail.com
 * @version 0.0.1
 */
var app = angular.module('jgQueries', [])
  .factory('jgSimpleHttpInterceptor', function ($q) {
    return {
      // optional method
      'request': function (config) {
        // do something on success
        return config;
      },
      // optional method
      'requestError': function (rejection) {
        // do something on error
        return $q.reject(rejection);
      },
      // optional method
      'response': function (response) {
        // do something on success
        return response;
      },
      // optional method
      'responseError': function (rejection) {
        // do something on error
        /*
         $injector.invoke(function (SessionService) {
         switch (rejection.status) {
         case 401:
         SessionService.destroy();
         SessionService.redirectToLogin();
         break;
         case 403:
         SessionService.unauthorized();
         break;
         case 404:
         SessionService.notFound();
         break;
         }
         });*/
        return $q.reject(rejection);
      }
    };
  })
  .config(["$httpProvider", function ($httpProvider) {
    $httpProvider.interceptors.push('jgSimpleHttpInterceptor');
  }])
  .provider('jgSimpleQueries', function () {
    var provider = this;
    var defaults = {
      base_url: "http://localhost:3234"
    }, _configs;

    this.config = function (configs) {
      configs = configs || angular.extend({}, defaults);
      _configs = angular.extend({}, defaults, configs);
      if (/\/$/.test(_configs.base_url)) {
        _configs.base_url.substr(0, _configs.base_url.length - 1)
      }
    };
    this.config();

    this.$get = ["$http", "$q", function ($http) {
      /* //Uncomment on case of fire...
       $http.defaults.transformResponse.unshift(function (value) {
       return value;
       });*/
      return {
        config: function (configs) {
          provider.config(configs);
        },
        executeRequest: function ($method, $url, $data, $params) {
          if (/^\//.test($url)) {
            $url = $url.substr(1);
          }
          return $http({
            method: $method,
            url: _configs.base_url + "/" + $url,
            data: $data,
            params: $params
          });
        }
      };
    }];
  });
