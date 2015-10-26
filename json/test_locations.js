require('mootools');
var fs = require('fs')

function haversine(origin, destination)
{
	var radians = function(degrees){ return degrees * (Math.PI / 180) },
		lat1 = origin[0],
		lon1 = origin[1],
		lat2 = destination[0],
		lon2 = destination[1],
		radius = 6371, // km
		dlat = radians(lat2-lat1),
		dlon = radians(lon2-lon1),
		a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dlon/2) * Math.sin(dlon/2),
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return radius * c * 1000
}

var points = require('./points');
// console.log('total points:', points.length);
// points.each(function(p){ console.log(JSON.encode(p)) });

function test(listing)
{
	fs.readFile('../web/'+listing+'.json', 'utf8', function(err, data)
	{
		if(err) return console.log(err);
// 		console.log(data);
		locateListing(JSON.decode(data))
	});
}

function locateListing(listing)
{
	var listing_coords = listing.geo.coordinates;
	listing_coords.reverse();
	console.log('listing_coords:', listing_coords);

	var distances = points.map(function(p){
		return [haversine(listing_coords, p.slice(0,2)), p]
	});

	distances.sort(function(a,b){return a[0]-b[0]});
	
// 	console.log(JSON.encode(listing.location), JSON.encode(distances[0][1].slice(2)));
// 	return;
	
// 	console.log('---');
	console.log(JSON.encode(listing.location), JSON.encode(distances[0][1].slice(2)));
	distances.each(function(p){ console.log(JSON.encode(p)) });
	console.log('---');
}


[
	'0b0b6a7dcc1d402ca7fe88f58d8df4cc',
	'0b722c04d0544adda509932485f481de',
	'0e2c92a108f548fda119847fc268b033',
	'1c2dd7fcdc614c92aefceb6591ba02f4',
	'514acf294b0e496caf36f1eed7e5ae7e',
	'cba9a1a6dc2141df8403b669be8f62c6',
	'ce89e347a789444ebbb32f5cd900bc0c',
	'e2d048996704442a94349180b09ebef9',
	'e97e13eb9ba8469daa9fd16a5647f99b'
].each(test);