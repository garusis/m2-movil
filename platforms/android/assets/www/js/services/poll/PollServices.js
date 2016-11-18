angular.module('makclaus')
    .factory("PollService", ["jgSimpleQueries", '$auth', function (jgSimpleQueries, $auth) {
        var pathBase = "polls";
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
            var dataSend = {poll: data};
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

        this.setStatus = function (data) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/setstatus", data);
        };

        this.solve = function (poll) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/solve", {poll: poll});
        };

        this.update = function (data) {
            var dataSend = {
                poll: data
            };
            return jgSimpleQueries.executeRequest("POST", pathBase + "/update", dataSend);
        };

        this.apply = function (data) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/apply", data);
        };


        this.deleteQuestionImage = function (where) {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/questions/removeimage", where);
        };


        this.getImageAnswerUploader = function (idAnswer) {
            var uploader = new FileUploader({
                autoUpload: true,
                removeAfterUpload: true,
                url: '/admin/polls/questions/answers/' + idAnswer + '/addimage',
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
    .factory("QuestionService", ["jgSimpleQueries", function (jgSimpleQueries) {
        var pathBase = "/polls/questions";
        this.list = function () {
            return jgSimpleQueries.executeRequest("POST", pathBase + "/list");
        };

        this.create = function (poll, question) {
            question.poll = poll.id;
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
    .factory("AnswerService", ["jgSimpleQueries", function (jgSimpleQueries) {

        var pathBase = "/polls/questions/answers";
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

        this.findAnswersByQuestion = function (idQuestion) {
            return jgSimpleQueries.executeRequest("GET", pathBase + "/findByQuestion", {}, {question: idQuestion})
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
