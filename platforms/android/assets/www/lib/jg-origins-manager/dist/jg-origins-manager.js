(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
(function () {


    var OriginsManagerProvider = function () {
        var configs = arguments[0];
        var provider = this;
        if (!(provider instanceof OriginsManagerProvider)) {
            provider = new OriginsManagerProvider(configs);
            return _.last(provider.$get)();
        }

        var defaults = {
            defaultOrigin: "origin"
        };
        if (window) {
            defaults.origins = {origin: window.location.origin};
        } else {
            defaults.origins = {origin: "http://localhost:3432"};
        }

        var confs = null;
        this.setDefaultOrigin = function (originName) {
            if (!_.isString(confs.origins[originName])) {
                throw new Error("The origin name " + originName + " has not been previously defined");
            }
            return confs.defaultOrigin = originName;
        };

        this.setOrigin = function (name, url) {
            if (arguments.length === 1 && _.isObject(name)) {
                var origins = name;
                confs.origins = _.defaults({}, origins, confs.origins);
                return confs.origins;
            } else if (!_.isString(name) || !_.isString(url)) {
                throw new Error("Bad use for setOrigin. Arguments must be nameOrigin:String, url:String or origins:Object");
            }
            confs.origins[name] = url;
            return confs.origins;
        };

        this.getOrigin = function (nameOrigin) {
            return nameOrigin ? confs.origins[nameOrigin] : confs.origins[confs.defaultOrigin];
        };

        this.config = function (configs) {
            confs = _.defaults({}, configs || {}, defaults);
        };
        this.config(configs);


        this.$get = [function () {
            return {
                getOrigin: provider.getOrigin.bind(provider),
                setOrigin: provider.setOrigin.bind(provider),
                setDefaultOrigin: provider.setDefaultOrigin.bind(provider)
            };
        }];
    };

    var app = angular.module("jg.originsManager", []);
    app.provider("originsManager", OriginsManagerProvider);
    module.exports = OriginsManagerProvider;
})();
},{}]},{},[1]);
