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
        logic.loadQuiz().then((dataObj)=>{
            res.render(viewUsers + 'start', dataObj);
        });
    },

    startQuiz: (req, res, next) => {
        logic.startQuiz(req.body.button).then((dataObj)=>{
            console.log(dataObj.judge)
            if(dataObj.judge === 1){
                res.render(viewUsers + 'results', dataObj);
            }
            res.render(viewUsers + 'start', dataObj);
        });
    },
}
