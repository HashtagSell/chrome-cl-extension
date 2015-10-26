require('mootools');

var fs = require('fs'),
	data = require('./CA_CL_Lat_Lon_V2'),
	points = [];

data.states[0].geo_areas.each(function(ga){
	console.log(ga.url);
	if(ga.selector) ga.selector = ga.selector.toString().trim();

	if(ga.subareas)
	{
		ga.subareas.each(function(sa){
			console.log('\t'+sa.name);
			if(sa.selector) sa.selector = sa.selector.toString().trim();

			var point;
			if(sa.neighborhoods)
			{
				var hood = sa.neighborhoods[0];
				if(hood.selector) hood.selector = hood.selector.toString().trim();
				point = [hood.coords[0], hood.coords[1], ga.aa, ga.selector, hood.aa, sa.selector];
			}
			else
			{
				point = [sa.coords[0], sa.coords[1], ga.aa, ga.selector, sa.aa, sa.selector];
			}
			console.log('\t\t'+JSON.encode(point));
			points.push(point);
		});
	}
	else
	{
		var point = [ga.coords[0], ga.coords[1], ga.aa, ga.selector]
		console.log('\t'+JSON.encode(point));
		points.push(point);
	}
});

console.log('total points:', points.length);
points.each(function(p){ console.log(JSON.encode(p)) });

fs.writeFile("points.json", JSON.stringify(points, null, 4), function(err) {
    if(err) return console.log(err);
    console.log("The file was saved!");
}); 