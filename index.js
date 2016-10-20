var mongo = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;
var express = require('express');
var app = express();

var insertDoc = function(db, entry, callback){
	var collection = db.collection('urls');
	collection.insert(entry, function(err, result){
		if(err) console.log(err);
		else {
			console.log('Inserted one entry');
			//console.log(result.result);
			callback(result);
		}
	});
};
var findDocs = function(db, query, proj, callback){
	var collection = db.collection('urls');
	collection.find(query, proj).toArray(function(err, docs){
		if(err) console.log(err);
		else {
			//console.log('Found the following docs');
			//console.dir(docs);
			callback(docs);
		}
	});
};
var deleteDocs = function(db, query, callback){
	var collection = db.collection('urls');
	collection.remove(query, function(err, result){
		if(err) console.log(err);
		else {
			console.log('Succesfully deleted docs');			
			callback(result);
		}
	});
};

app.set('port', (process.env.PORT || 5000));

app.use('/', express.static(__dirname + '/public'));

app.get('/new/*', function(req, res){	
	
});

app.get('/etc', function(req, res){	
	mongo.connect(url, function(err, db){
		if(err) {
			console.log(err);
			res.send('Error connecting to the database');
		} else {
			console.log('Connection to db established');
			findDocs(db, {}, {_id:0}, function(result){
				
			
				db.close();
			});
		}
	});
});	

app.get('*', function(req, res){
	res.send({'error': '404 not found'});
});


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));    
});