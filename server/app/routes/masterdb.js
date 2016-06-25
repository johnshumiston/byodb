'use strict';

var db = require('../../db');
var Database = db.model('database');
var router = require('express').Router();
var pg = require('pg');
var Sequelize = require('sequelize');


module.exports = router;

router.post('/', function(req, res, next) {
    if(!req.user) res.sendStatus(404);
    Database.create(req.body)
    .then(function(createdDB) {
        Database.makeClientDatabase(createdDB);
        return createdDB
    })
    .then(function(createdDB) {
        res.send(createdDB);
    })
    .catch(next);
})

router.get('/', function(req, res, next){
    Database.findAll()
    .then(function(allDBs){
        res.send(allDBs)
    })
})