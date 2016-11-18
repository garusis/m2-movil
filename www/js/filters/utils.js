/**
 * Created by Marcos J. Alvarez on 02/12/2015.
 * @author Marcos J. Alvarez
 * @email garusis@gmail.com
 * @version 0.0.1
 */
angular.module('makclaus')
  .filter('originsManager', ['originsManager', function (originsManager) {
    return function (input, origin) {
      return originsManager.getOrigin(origin) + input;
    };
  }]);
