app.factory('TableFactory', function ($http, $stateParams) {

	var TableFactory = {};

	function resToData(res) {
        return res.data;
    }

    TableFactory.getAllTables = function(dbName){
    	return $http.get('/api/clientdb/' + dbName)
    	.then(resToData)
    }

    TableFactory.getSingleTable = function(dbName, tableName){
        return $http.get('/api/clientdb/' + dbName + '/' + tableName)
        .then(resToData)
    }

    TableFactory.getDbName = function(dbName){
        return $http.get('/api/masterdb/' + dbName)
        .then(resToData)
    }

    TableFactory.filter = function(dbName, tableName, data) {
        return $http.put('/api/clientdb/' + dbName + '/' + tableName + '/filter', data)
    }

    TableFactory.updateBackend = function(dbName, tableName, data) {
        return $http.put('api/clientdb/' + dbName + '/' + tableName, data)
        .then(resToData);
    }

    TableFactory.addRow = function(dbName, tableName, rowNumber) {
        return $http.post('api/clientdb/addrow/' + dbName + '/' + tableName, {rowNumber: rowNumber})
        .then(resToData);
    }

    TableFactory.removeRow = function(dbName, tableName, rowId){
        return $http.delete('/api/clientdb/' + dbName + '/' + tableName + '/' + rowId)
        .then(resToData)
    }

    TableFactory.removeColumn = function(dbName, tableName, columnName){
        return $http.delete('/api/clientdb/' + dbName + '/' + tableName + '/column/' + columnName)
        .then(resToData)
    }

    TableFactory.addColumn = function(dbName, tableName, numNewCol){
        return $http.post('api/clientdb/addcolumn/' + dbName + '/' + tableName + '/' + numNewCol)
    }
    TableFactory.createTable = function(table){
        table.dbName = $stateParams.dbName;
        return $http.post('/api/clientdb', table)
        .then(resToData);
    }

    TableFactory.deleteTable = function(currentTable) {
        return $http.delete('/api/clientdb/' + currentTable.dbName + '/' + currentTable.tableName)
    }

    TableFactory.makeAssociations = function(association, dbName) {
        return $http.post('/api/clientdb/' + dbName + '/association', association)
        .then(resToData);
    }

    TableFactory.deleteDb = function(dbName) {
        return $http.delete('/api/clientdb/' + dbName)
        .then(resToData);
    }

    TableFactory.getAssociations = function(dbName, tableName) {
        return $http.get('/api/clientdb/associationtable/' + dbName + '/' + tableName)
        .then(resToData);
    }

     TableFactory.getAllAssociations = function(dbName) {
        return $http.get('/api/clientdb/allassociations/' + dbName)
        .then(resToData);
    }

    TableFactory.getAllColumns = function(dbName) {
        return $http.get('/api/clientdb/getallcolumns/' + dbName)
        .then(resToData);
    }

    TableFactory.getColumnsForTable = function(dbName, tableName){
        return $http.get('/api/clientdb/columnsfortable/' + dbName + '/' + tableName)
        .then(resToData);
    }

    TableFactory.runJoin = function(dbName, table1, arrayOfTables, selectedColumns, associations, colsToReturn) {
        var data = {};
        data.dbName = dbName;
        data.table2 = arrayOfTables[0];
        data.arrayOfTables = arrayOfTables;
        data.selectedColumns = selectedColumns;
        data.colsToReturn = colsToReturn;

        // [hasMany, hasOne, hasMany primary key, hasOne forgein key]

        associations.forEach(function(row) {
            if(row.Table1 === table1 && row.Table2 === data.table2){
                data.alias = row.Alias1;
                if(row.Relationship1 === 'hasOne'){
                    data.table1 = row.Table2;
                    data.table2 = row.Table1;
                }
                else{
                    data.table1 = row.Table1;
                    data.table2 = row.Table2;   
                }
            }
            else if(row.Table1 === data.table2 && row.Table2 === table1){
                data.alias = row.Alias1;
                if(row.Relationship1 === 'hasMany'){
                    data.table1 = row.Table1;
                    data.table2 = row.Table2;
                }
                else{
                    data.table1 = row.Table2;
                    data.table2 = row.Table1;   
                }
            }
        })

        console.log('DATA',data);

        return $http.put('/api/clientdb/runjoin', data)
        .then(resToData);
    }

    TableFactory.getPrimaryKeys = function(id, dbName, tableName, columnkey){
        return $http.get('/api/clientdb/' + dbName + '/' + tableName + '/' + id + "/" + columnkey)
        .then(resToData);
    }

    TableFactory.findPrimary = function(dbName, tblName){
        return $http.get('/api/clientdb/primary/'+dbName+'/'+tblName)
        .then(resToData);
    }

    TableFactory.setForeignKey = function(dbName, tblName, colName, id1, id2){
        var data = {};
        data.dbName = dbName;
        data.tblName = tblName;
        data.colName = colName;
        data.id1 = id1;
        data.id2 = id2;

        return $http.put('/api/clientdb/setForeignKey', data)
        .then(resToData);   
    }

    TableFactory.updateJoinTable = function(dbName, tableName, id, newRow, tableToUpdate, columnName) {
        var data = {};
        data.dbName = dbName;
        data.tblName = tableName;
        data.rowId = id;
        data.newRow = newRow;
        data.tableToUpdate = tableToUpdate;
        data.columnName = columnName;
       
       return $http.put('/api/clientdb/updateJoinTable', data)
       .then(resToData);  
    }

    TableFactory.increment = function(dbName, tableName) {
        return $http.put('/api/clientdb/'+ dbName + '/' + tableName +'/addrowonjoin')
        .then(resToData);
    }

	return TableFactory; 
})