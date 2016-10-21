var mongo = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;
var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: process.env.api_key,            
      secret: process.env.secret
    };
var express = require('express');
var app = express();

var insertDoc = function(db, entry, callback){
	var collection = db.collection('latest');
	collection.insert(entry, function(err, result){
		if(err) console.log(err);
		else {
			console.log('Inserted one entry');
			//console.log(result.result);
			callback(result);
		}
	});
};
var findDocs = function(db, query, proj, sort, limit, callback){
	var collection = db.collection('latest');
	collection.find(query, proj).sort(sort).limit(limit).toArray(function(err, docs){
		if(err) console.log(err);
		else {
			//console.log('Found the following docs');
			//console.dir(docs);
			callback(docs);
		}
	});
};
var deleteDocs = function(db, query, callback){
	var collection = db.collection('latest');
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

app.get('/search', function(req, res){	
	if (Number.isInteger(+req.query.offset)) {
		var offset = +req.query.offset>90 ? 90 : +req.query.offset;
	} else var offset = 0;
	

	Flickr.tokenOnly(flickrOptions, function(error, flickr) {
		if (error) console.log(error);
		flickr.photos.search({
		  	text: req.query.q,
		  	sort: 'interestingness-desc',	
		  	lat: req.query.lat,
		  	lon: req.query.lon,
		  	radius: 5,
		  	page: 1,
		  	per_page: 100,
		  	format: 'json'
		}, function(err, result) {
			if (err) {
				console.log(err);
				res.send ({error: err.message});
			} else {
				var phArr = result.photos.photo.slice(offset, offset+10);
				var result = [], pUrl, desc, thumbnail, context;
				phArr.forEach(function(p){
					pUrl = 'https://farm'+p.farm+'.staticflickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_b.jpg';
					desc = p.title;
					thumbnail = 'https://farm'+p.farm+'.staticflickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_t.jpg';
					context = 'https://www.flickr.com/photos/'+p.owner+'/'+p.id;
					result.push({url: pUrl, desc: desc, thumbnail: thumbnail, context: context});
				});
			  	res.send(result);
			}

		  	var time = new Date;		  	
		  	mongo.connect(url, function(err, db){
				if(err) {					
					console.log('Error connecting to the database', err);					
				} else {
					console.log('Connection to db established');
					insertDoc(db, {term: req.query.q, lat: req.query.lat, lon: req.query.lon, when: time.toISOString()}, function(){
						db.close();
					});					
				}
			});

		});
	});	

});

app.get('/latest', function(req, res){	
	mongo.connect(url, function(err, db){
		if(err) {
			console.log(err);
			res.send('Error connecting to the database');
		} else {
			console.log('Connection to db established');			
			findDocs(db, {}, {_id:0}, {when: -1}, 10, function(result){
				res.send(result);
				//deleteDocs(db, {}, function(){});
				db.close();
			});
		}
	});
});	

app.get('*', function(req, res){
	res.send({'error': 'page not found'});
});


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));    
});