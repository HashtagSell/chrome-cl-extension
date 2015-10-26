require('mootools');

var fs = require('fs'),
	data = require('./cl_cat_mapping'),
	cats = {};

data.each(function(cat){
	console.log(cat);

	if(cat.cl_code) cats[cat.code] = cat.cl_code;

	if(cat.categories)
		cat.categories.each(function(cc){
			if(!cc.cl_code) return;
			cats[cc.code] = cc.cl_code;
		});

});

console.log(cats);

fs.writeFile("categories.json", JSON.stringify(cats, null, 4), function(err) {
    if(err) return console.log(err);
    console.log("The file was saved!");
}); 