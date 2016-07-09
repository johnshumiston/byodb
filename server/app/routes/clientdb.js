'use strict';

var db = require('../../db');
var Database = db.model('database');
var router = require('express').Router();
var Sequelize = require('sequelize');
var knex = require('knex');
var pg = require('pg');


module.exports = router;

router.put('/:dbName/:tableName/addrowonjoin', function(req, res, next) {
    var knex = require('knex')({
      client: 'pg',
      connection: 'postgres://localhost:5432/' + req.params.dbName,
      searchPath: 'knex,public'
  })

  knex.select().from(req.params.tableName).options({ rowMode: 'array' })
      .then(function(result) {
          var max = 0;
          result.forEach(function(arr) {
              if (arr[0] > max) max = arr[0];
          })
          max++;
          knex(req.params.tableName).insert({ id: max })
          .then(function() {
              knex.select().from(req.params.tableName).options({ rowMode: 'array' })
              .then(function(instanceArr) {
                  res.send(instanceArr);
              })
          })
      })
    .catch(next);
})

router.put('/runjoin', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.body.dbName,
        searchPath: 'knex,public'
    })

    var hasMany = req.body.table1; 
    var hasOne = req.body.table2; 
    var hasOneForgeinKey = req.body.alias; 
        console.log(req.body)
    // [hasMany, hasOne, hasMany primary key, hasOne forgein key]
    // knex('Teams').join('Players', 'Teams.id', '=', 'Players.TeamId').select('*')
    // select * from "Teams" inner join "Players" on "Teams"."id" = "Teams"."PlayerId" - column Teams.PlayerId does not exist
    knex(hasMany).join(hasOne, hasMany + '.id', '=', hasOne + '.' + hasOneForgeinKey).select(req.body.colsToReturn).options({rowMode : 'array'})
        .then(function(result) {
            result.push(req.body.colsToReturn)
            console.log('RESULT', result);
            res.send(result);
        })
        .then(function(){
            knex.destroy();
        })
})

router.put('/updateJoinTable', function(req, res, next) {
    console.log('REQBODY', req.body);
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.body.dbName,
        searchPath: 'knex,public'
    })


    var columnToUpdate = req.body.columnName;  
    var tableToUpdate = req.body.tableToUpdate;
    var updateObj = {};
    updateObj[columnToUpdate] = req.body.newRow;

    console.log('COLTOUPDATE', columnToUpdate);
    console.log('NEWROW', req.body.newRow)
    console.log(updateObj);

    knex(tableToUpdate).where('id', req.body.rowId).update(updateObj)
    .then(function(result) {
        console.log('RESULT', result);
        res.send(result);
    })
    .then(function() {
        knex.destroy();
    })

})

router.put('/setForeignKey', function(req, res, next){
    console.log(req.body);
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.body.dbName,
        searchPath: 'knex,public'
    })

    var updateObj = {};
    var id1 = Number(req.body.id1);

    updateObj[req.body.colName] = req.body.id2

    console.log(updateObj);

    var id2 = Number(req.body.id2);
    var colName = req.body.colname;

    knex(req.body.tblName).where('id', id1).update(updateObj)
    .then(function(result){
        console.log(result)
        res.send(result)
    })
    .then(function(){
        knex.destroy();
    })

})

router.get('/columnsfortable/:dbName/:tableName', function(req, res, next) {
    var ColumnsNames = [];

    var pg = require('pg');

    var conString = 'postgres://localhost:5432/' + req.params.dbName;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            console.log('ERROR1');
            res.send('could not connect to postgres');
        }

        var TablesNames = [];
        client.query("SELECT column_name FROM information_schema.columns WHERE table_name = \'" + req.params.tableName + "\'", function(err, result) {
            if (err) {
                console.log(err);
                res.send('error running query');
            }
            var ColumnsNames = [];
            result.rows.forEach(function(obj) {
                ColumnsNames.push(obj.column_name)
            })
            res.send({ tableName: req.params.tableName, columns: ColumnsNames });
            client.end();
        })
    })
})


//get all the information from the association table
router.get('/allassociations/:dbName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    })

    knex.schema.createTableIfNotExists(req.params.dbName + '_assoc', function(table) {
            table.increments();
            table.string('Table1');
            table.string('Relationship1');
            table.string('Alias1');
            table.string('Table2');
            table.string('Relationship2');
            table.string('Alias2');
            table.string('Through');
        })
        .then(function() {
            knex.select().table(req.params.dbName + '_assoc')
                .then(function(result) {
                    res.send(result);
                })
        })
        .then(function(){
            knex.destroy();
        })
})

//get information from the association table for a single table
router.get('/associationtable/:dbName/:tableName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    })

    knex(req.params.dbName + '_assoc').where(function() {
            this.where('Table1', req.params.tableName).orWhere('Table2', req.params.tableName).orWhere('Through', req.params.tableName)
        })
        .then(function(result) {
            res.send(result);
        })
        .then(function(){
            knex.destroy();
        })
})

//get all columns for an entire database
router.get('/getallcolumns/:dbName', function(req, res, next) {
    var ColumnsNames = [];

    var pg = require('pg');

    var conString = 'postgres://localhost:5432/' + req.params.dbName;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            console.log('ERROR1');
            res.send('could not connect to postgres');
        }

        var TablesNames = [];
        client.query("SELECT column_name, table_name, data_type FROM information_schema.columns WHERE table_schema = 'public'", function(err, result) {
            if (err) {
                console.log(err);
                res.send('error running query');
            }
            var ColumnsNames = [];
            result.rows.forEach(function(obj) {
                ColumnsNames.push(obj)
            })
            res.send(ColumnsNames);
            client.end();
        })
    })
})

// delete a db
router.delete('/:dbn', function(req, res) {
    var pg = require('pg');

    var conString = 'postgres://localhost:5432/masterDB';

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            console.log(err)
            res.send('could not connect to postgres');
        }
        client.query("REVOKE CONNECT ON DATABASE " + req.params.dbn + " FROM public", function(err, result) {
            if (err) {
                console.log('err')
                res.send('error running query');
            }
        });
        client.query("ALTER DATABASE " + req.params.dbn + " CONNECTION LIMIT 0 ", function(err, result) {
            if (err) {
                console.log(err)
                res.send('error running query');
            }
        });
        client.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid()", function(err, result) {
            if (err) {
                console.log(err)
                res.send('error running query');
            }
        });
        client.query("DROP DATABASE " + req.params.dbn, function(err, result) {
            if (err) {
                console.log(err)
                res.send('error running query');
            }
            res.set("Content-Type", 'text/javascript'); //avoid the "Resource interpreted as Script but transferred with MIME type text/html" message
            res.send(result);
            client.end();
        });
    });

});

//create a table + columns for that created table
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
            return knex(req.body.name).insert([
                { id: 1 },
            ]);
        })
        .then(function(){
            res.sendStatus(200);
            knex.destroy();
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

    var findingTable = knex.select().from(req.params.tableName)

    var findingForeignIds = knex(req.params.dbName + "_assoc").where({
            Relationship1: 'hasOne',
            Table1: req.params.tableName
        }).orWhere({
            Relationship2: 'hasOne',
            Table2: req.params.tableName
        })
        .then(function(Table) {
            if (Table.length === 0) {
                return;
            } else {
                if (Table[0].Relationship1 === 'hasOne') {
                    return knex.select('id').from(Table[0].Table2)
                } else {
                    return knex.select('id').from(Table[0].Table1)
                }
            }
        })
    Promise.all([findingTable, findingForeignIds])
        .then(function(result) {
            res.send(result);
        })
        .then(function(){
            knex.destroy();
        })

})


router.get('/primary/:dbName/:tblName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });

    knex.select().from(req.params.tblName)
        .then(function(result) {
            res.send(result)
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);

})

router.get('/:dbName/:tableName/:id/:columnkey', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });

    var numId = Number(req.params.id);

    console.log(req.params);

    knex(req.params.tableName).where(req.params.columnkey, numId)
        .then(function(result) {
            res.send(result);
        })
        .then(function(){
            knex.destroy();
        })
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
            res.send(result)
        })
        .then(function(){
            knex.destroy();
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
            });
            Promise.all(promises2);
        })
        .then(function() {
            res.sendStatus(200);
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);
});


// delete row in table
router.delete('/:dbName/:tableName/:rowId', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });
    knex(req.params.tableName)
        .where('id', req.params.rowId)
        .del()
        .then(function() {
            knex.select().from(req.params.tableName)
                .then(function(foundTable) {
                    res.send(foundTable)
                })
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);
})

// delete column in table
router.delete('/:dbName/:tableName/column/:columnName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });
    knex.schema.table(req.params.tableName, function(table) {
            table.dropColumn(req.params.columnName)
        })
        .then(function(res) {
            return knex.select().from(req.params.tableName)
        })
        .then(function(foundTable) {
            res.send(foundTable)
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);
})

// add a row
router.post('/addrow/:dbName/:tableName', function(req, res, next) {
    console.log('HERE IT IS!!!!!', req.body)
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });
    knex(req.params.tableName).insert({ id: req.body.rowNumber })
        .then(function() {
            knex.select().from(req.params.tableName)
                .then(function(foundTable) {
                    res.send(foundTable)
                })
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);
})

//add a column
router.post('/addcolumn/:dbName/:tableName/:numNewCol', function(req, res, next) {
    var pg = require('pg');

    var conString = 'postgres://localhost:5432/' + req.params.dbName;

    var client = new pg.Client(conString);
    client.connect(function(err) {
        if (err) {
            res.send('could not connect to postgres');
        }
        client.query("ALTER TABLE \"" + req.params.tableName + "\" ADD COLUMN \"" + req.params.numNewCol + "\" text", function(err, result) {

            if (err) {
                console.log(err)
                res.send('error running query');
            }
            res.set("Content-Type", 'text/javascript');
            res.send(result);
            client.end();
        });
    })
})

//make an association
router.post('/:dbName/association', function(req, res, next) {
    var pg = require('pg');
    var conString = 'postgres://localhost:5432/' + req.params.dbName;
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    });
    return knex(req.params.dbName + '_assoc').insert({
            Table1: req.body.table1.table_name,
            Alias1: req.body.alias1,
            Relationship1: req.body.type1,
            Table2: req.body.table2.table_name,
            Alias2: req.body.alias2,
            Relationship2: req.body.type2,
            Through: req.body.through
        })
        //Connects to PG to create columns
        .then(function(result) {
            var client = new pg.Client(conString);
            client.connect(function(err) {
                if (err) {
                    console.log('DATABASE FAILED TO CONNECT')
                    res.send('database failed to connect')
                }
                //Player hasOne Team -- Adds teamid column using PG sets datatype to integer <-- IMPORTANT
                if (req.body.type1 === 'hasOne') {

                    client.query("ALTER TABLE \"" + req.body.table1.table_name + "\" ADD COLUMN " + "\"" + req.body.alias1 + "\"" + " integer", function(err, result) {
                            if (err) {
                                console.log("ADD COLUMN FAILED", err)
                                res.send('Error running query')
                            }
                        })
                        //Finds newly created column ('teamid') and makes it a foreign key to Teams.id
                        //data type on both tables need to match in order for foreign key to work
                    knex.schema.table(req.body.table1.table_name, function(table) {
                            table.foreign(req.body.alias1).references('id').inTable(req.body.table2.table_name);
                        })
                        .then(function(result) {
                            res.send(result);
                        })
                        .then(function(){
                            knex.destroy();
                        })
                        .catch(function(err) {
                            console.log(err);
                        })
                }
                //need to make above work in alternate direction 
                if (req.body.type2 === 'hasOne' && req.body.type1 !== 'hasOne') {
                    client.query("ALTER TABLE \"" + req.body.table2.table_name + "\" ADD COLUMN " + "\"" + req.body.alias2 + "\"" + " integer", function(err, result) {
                            if (err) {
                                console.log("ADD COLUMN FAILED", err)
                                res.send('Error running query')
                            }
                        })
                        //Finds newly created column ('teamid') and makes it a foreign key to Teams.id
                        //data type on both tables need to match in order for foreign key to work
                    knex.schema.table(req.body.table2.table_name, function(table) {
                            table.foreign(req.body.alias2).references('id').inTable(req.body.table1.table_name);
                        })
                        .then(function(result) {
                            res.send(result);
                        })
                        .then(function(){
                            knex.destroy();
                        })
                        .catch(function(err) {
                            console.log(err);
                        })
                }

            })
                //creates a join table for now-- have to figure out away to make foreign key/associations align in the database 
            if (req.body.type1 === 'hasMany' && req.body.type2 === 'hasMany') {
                return knex.schema.createTable(req.body.through, function(table) {
                        table.increments();
                        table.integer(req.body.alias2).references('id').inTable(req.body.table1.table_name);
                        table.integer(req.body.alias1).references('id').inTable(req.body.table2.table_name);
                    })
                    .then(function() {
                        return knex(req.body.through).insert([
                            { id: 1 },
                        ]);
                    })
                    .then(function() {
                        res.sendStatus(200);
                    })
                    .then(function(){
                        knex.destroy();
                    })
                    .catch(next);
            }
        })
        .catch(next);
})

//delete a table
router.delete('/:dbName/:tableName', function(req, res, next) {
    var knex = require('knex')({
        client: 'pg',
        connection: 'postgres://localhost:5432/' + req.params.dbName,
        searchPath: 'knex,public'
    })

    knex.schema.dropTable(req.params.tableName)
        .then(function(result) {
            res.status(201).send(result)
        })
        .then(function(){
            knex.destroy();
        })
        .catch(next);

})
