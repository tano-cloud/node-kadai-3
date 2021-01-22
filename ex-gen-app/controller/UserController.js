const express = require('express');
const logic = require('../models/logic');
const viewUsers = './users/'
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom
const request = require('request');

module.exports = {
    displayHome: (req, res, next) => {
        logic.displayHome().then((data) => {
            res.render(viewUsers + 'home', data);
        });
    },

    redirect: (req, res, next) => {
            res.render(viewUsers + 'redirect')
    },

    loadQuiz: (req, res, next) => {
        logic.loadQuiz().then((data_obj, id)=>{
            res.render(viewUsers + 'start', data_obj);
        });
    },

    startQuiz: (req, res, next) => {
        logic.startQuiz(req.body.button).then((data_obj)=>{
            res.render(viewUsers + 'start', data_obj);
        });
    },
}
