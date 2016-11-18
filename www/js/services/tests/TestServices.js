angular.module('makclaus')
    .factory("TestService", ["jgSimpleQueries", '$auth', function (jgSimpleQueries, $auth) {
        var pathBase = "tests";
        this.list = function (query) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/list", query);
        };

        this.listPendings = function (query) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/listPending");
        };

        this.listApply = function (query) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/listapply", query);
        };

        this.create = function (data) {
            var dataSend = {test: data};
            return jgSimpleQueries.executeRequest("POST", pathBase + "/create", dataSend);
        };

        this.get = function (id) {
            var dataSend = {};
            dataSend.id = id;
            return jgSimpleQueries.executeRequest("GET", pathBase + "/get", {}, {id: id});
        };

        this.getAplicated = function (id) {
            var dataSend = {};
            dataSend.id = id;
            return jgSimpleQueries.executeRequest("GET", pathBase + "/getaplicated", {}, {id: id});
        };

        this.getSolved = function (id) {
            var dataSend = {};
            dataSend.id = id;
            return jgSimpleQueries.executeRequest("GET", pathBase + "/solved", {}, {id: id});
        };

        this.getStatus = function (id) {
            return jgSimpleQueries.executeRequest("GET", pathBase + "/" + id + "/status");
        };

        this.setStatus = function (data) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/setstatus", data);
        };

        this.getStats = function (id) {
            return jgSimpleQueries.executeRequest("GET", pathBase + "/getstats", {id: id});
        };

        this.solve = function (test) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/solve", {test: test});
        };

        this.update = function (data) {
            var dataSend = {
                test: data
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/update", dataSend);
        };

        this.apply = function (data) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/apply", data);
        };

        this.getImageQuestionUploader = function (idQuestion) {
            var uploader = new FileUploader({
                autoUpload: true,
                removeAfterUpload: true,
                url: '/admin/tests/questions/' + idQuestion + '/addimage',
                headers: {
                    'Authorization': 'Bearer ' + $auth.getToken()
                }
            });
            uploader.filters.push({
                name: 'customFilter',
                fn: function (item, options) {
                    return this.queue.length < 10;
                }
            });
            uploader.filters.push({
                name: 'fileTypeFilter',
                fn: function (item /*{File|FileLikeObject}*/, options) {
                    return /\/(jpeg|png)$/.test((item.file || item).type);
                }
            });
            return uploader;
        };

        this.deleteQuestionImage = function (where) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/questions/removeimage", where);
        };


        this.getImageAnswerUploader = function (idAnswer) {
            var uploader = new FileUploader({
                autoUpload: true,
                removeAfterUpload: true,
                url: '/admin/tests/questions/answers/' + idAnswer + '/addimage',
                headers: {
                    'Authorization': 'Bearer ' + $auth.getToken()
                }
            });
            uploader.filters.push({
                name: 'customFilter',
                fn: function (item, options) {
                    return this.queue.length < 10;
                }
            });
            uploader.filters.push({
                name: 'fileTypeFilter',
                fn: function (item /*{File|FileLikeObject}*/, options) {
                    return /\/(jpeg|png)$/.test((item.file || item).type);
                }
            });
            return uploader;
        };

        this.deleteAnswerImage = function (where) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/questions/answers/removeimage", where);
        };
        return this;
    }])
    .factory("TestQuestionService", ["jgSimpleQueries", function (jgSimpleQueries) {
        var pathBase = "/tests/questions";
        this.list = function () {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/list");
        };

        this.create = function (test, question) {
            question.test = test.id;
            var dataSend = {
                question: question
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/create", dataSend);
        };

        this.update = function (question) {
            var dataSend = {
                question: question
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/update", dataSend);
        };

        this.delete = function (question) {
            var dataSend = {
                question: question
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/delete", dataSend);
        };

        return this;
    }])
    .factory("TestAnswerService", ["jgSimpleQueries", function (jgSimpleQueries) {

        var pathBase = "/tests/questions/answers";
        this.pathBase = pathBase;

        this.list = function () {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/list");
        };

        this.create = function (data, question) {
            data.question = question.id;
            var dataSend = {
                answer: data
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/create", dataSend);
        };

        this.update = function (data) {
            var dataSend = {
                answer: data
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/update", dataSend);
        };

        this.delete = function (data) {
            var dataSend = {
                answer: data
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/delete", dataSend);
        };

        this.get = function (id) {
            var dataSend = {};
            dataSend.id = id;
            return jgSimpleQueries.executeRequest("GET", pathBase + "/get", {}, {id: id});
        };

        return this;
    }]);
