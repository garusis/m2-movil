/**
 * Created by Marcos J. Alvarez on 11/08/2015.
 * @author Marcos J. Alvarez
 * @email garusis@gmail.com
 * @version 0.0.1
 */
angular
    .module('makclaus')
    .service("userMedia", function () {
        var getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia).bind(navigator);
        return {
            getUserMedia: function (constrains, cb, errCb) {
                getMedia(constrains, cb, errCb);
            }
        }
    });
