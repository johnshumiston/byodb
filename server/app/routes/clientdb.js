'use strict';

var db = require('../../db');
var Database = db.model('database');
var router = require('express').Router();
var Sequelize = require('sequelize');
var knex = require('knex');
var pg = require('pg');


module.exports = router;

router.post('/', function(req, res, next) {
    if (!req.user) res.sendStatus(404);

    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.body.dbName,
        searchPath: 'knex,public'
    });

    knex.schema.createTable(req.body.name, function(table) {
            table.increments();
            for (var key in req.body.column) {
                table[req.body.type[key]](req.body.column[key])
            }
            table.timestamps();
        }).then(function() {
            res.sendStatus(200);
        })
        .catch(next);


})

//route to get all tables from a db
// DO WE NEED TO INCLUDE SOMETHING TO HANDLE INJECTION ATTACK?
router.get('/:dbName', function(req, res) {
    var pg = require('pg');

    var conString = 'postgres://localhost:5432/' + req.params.dbName;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            res.send('could not connect to postgres');
        }
        client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'", function(err, result) {
            if (err) {
                res.send('error running query');
            }
            res.set("Content-Type", 'text/javascript'); //avoid the "Resource interpreted as Script but transferred with MIME type text/html" message
            res.send(result);
            client.end();
        });
    });

});

//route to get a single table from a db
// DO NEED TO COME UP WITH A WAY TO REMOVE SPACES FROM THE TABLE NAME WHEN IT GETS SAVED?
router.get('/:dbName/:tableName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });

    knex.select().from(req.params.tableName)
        .then(function(foundTable) {
            res.send(foundTable)
        })
        .catch(next);
})

//route to query a single table (filter)
router.put('/:dbName/:tableName/filter', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    })
    knex(req.params.tableName).where(req.body.column, req.body.comparator, req.body.value)
        .then(function(result) {
            console.log(result);
            res.send(result)
        })
        .catch(next);
})

//route to update data in a table (columns and rows)
router.put('/:dbName/:tableName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    })
    var promises = [];
    req.body.rows.forEach(function(row) {
        var promise = knex(req.params.tableName)
            .where('id', '=', row.id)
            .update(row)

        promises.push(promise)
    })
    Promise.all(promises)
        .then(function(result) {
            var promises2 = [];
            req.body.columns.forEach(function(column) {
                var promise2 = knex.schema.table(req.params.tableName, function(table) {
                    var oldVal = column.oldVal;
                    var newVal = column.newVal;
                    table.renameColumn(oldVal, newVal)
                })
                promises2.push(promise2);
            })
            Promise.all(promises2)
        })
        .then(function() {
            res.sendStatus(200);
        })
        .catch(next);
})


//delete a row in a table
router.delete('/:dbName/:tableName/:rowId', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });
    knex(req.params.tableName)
        .where('id', req.params.rowId)
        .del()
        .catch(next);
})

router.post('/:dbName/association', function(req, res, next) {
    console.log('REQBODY', req.body);
    var pg = require('pg');

    var conString = 'postgres://localhost:5432/' + req.params.dbName;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            res.send('could not connect to postgres');
        }
        //if relation is hasOne
        client.query("ALTER TABLE " + req.body.table1.table_name + " ADD COLUMN " + req.body.table2.table_name + "_id character varying(50)", function(err, result) {
            if (err) {
                console.log('ERROR 2');
                res.send('error running query');
            }
            res.set("Content-Type", 'text/javascript'); //avoid the "Resource interpreted as Script but transferred with MIME type text/html" message
            res.send(result);
            client.end();
        });
    });
})




























