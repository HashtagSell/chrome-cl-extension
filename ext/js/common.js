	function $fx(ele, name, fx)
	{
		if(!name) name = 'function';
		if(fx) return ele.store(name, fx);
		return ele.retrieve(name)
	}
	
	// element tools
	function $$$(cls, ele)
	{
		try
		{
			if(ele) return ele.getElement(cls);
			return $$(cls)[0];
		}
		catch(e){}
	}

	function $EL(type, attr){ return new Element(type, attr) }
	
	function $E(type, cls)
	{
		if(cls) cls = {'class' : cls};
		return $EL(type, cls)
	}

	function $CODE(cls){ return $E('code', cls) }

	function $H1(cls){ return $E('h1', cls) }
	function $H2(cls){ return $E('h2', cls) }
	function $H3(cls){ return $E('h3', cls) }
	function $H4(cls){ return $E('h4', cls) }
	function $H5(cls){ return $E('h5', cls) }
	function $H6(cls){ return $E('h6', cls) }

	function $UL(cls){ return $E('ul', cls) }
	function $LI(cls){ return $E('li', cls) }

	function $DL(cls){ return $E('dl', cls) }
	function $DT(cls){ return $E('dt', cls) }
	function $DD(cls){ return $E('dd', cls) }

	function $DIV(cls){ return $E('div', cls) }
	function $SPAN(cls){ return $E('span', cls) }

	function $CANVAS(cls){ return $E('canvas', cls) }
	function $IMG(cls){ return $E('img', cls) }

	function $INPUT(cls){ return $E('input', cls) }
	function $TEXTAREA(cls){ return $E('textarea', cls) }
	
	function $LABEL(cls){ return $E('label', cls) }

	function $TABLE(cls){ return $E('table', cls) }
	function $TH(cls){ return $E('th', cls) }
	function $TR(cls){ return $E('tr', cls) }
	function $TD(cls){ return $E('td', cls) }

	function $DL(cls){ return $E('dl', cls) }
	function $DD(cls){ return $E('dd', cls) }
	function $DT(cls){ return $E('dt', cls) }

	function $SELECT(cls){ return $E('select', cls) }
	function $OPTION(cls){ return $E('option', cls) }

	function $A(cls){ return $E('a', cls) }
	function $B(cls){ return $E('b', cls) }
	function $P(cls){ return $E('p', cls) }
	function $EM(cls){ return $E('em', cls) }

	function $IFRAME(cls){ return $E('iframe', cls) }

	function $STYLE(cls){ return $E('style', cls) }

	// object tools
	function parseAndCheck(object_type, var_name, var_data, default_value)
	{
		if(typeOf(var_data) == object_type) return var_data;

		var c = (object_type == 'object') ? '{' : '[';
		debug('parseAndCheck[:1]: ' + var_data.substring(0,1));
		
		if(type(var_data) == 'string' && var_data.substring(0,1) == c) var_data = JSON.parse(var_data);
		if(type(var_data) != object_type)
		{
			if(!default_value) 
				throw (var_name + ' must be ' + object_type);
			else
				var_data = default_value;
		}
		return var_data
	}

	function verifyEmail(email)
	{
		return (email.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) != -1);
	}

	function queryStringObject(location)
	{
		if(!location) location = document.location.search;
		return location.substring(1).parseQueryString()
	}

	function Goto(_loc, _new)
	{
		if(_new) return window.open(_loc);
		document.location.href = _loc;
	}

	String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g,""); }
	String.prototype.ltrim = function(){ return this.replace(/^\s+/,""); }
	String.prototype.rtrim = function(){ return this.replace(/\s+$/,""); }
	String.prototype.startsWith = function(str){ return (this.indexOf(str) === 0); }
	String.prototype.leftPad = function(l, c){ return new Array(l - this.length + 1).join(c || '0') + this; }

	function Shorten(input, maxlen, suffix)
	{
		if(!input) return;

		if(!suffix) suffix = '...';
		else if(suffix == 'none') 
		{
			suffix = '';
			maxlen+=3;
		}

		return (input.length > maxlen) ? input.trim().substring(0,(maxlen-3)).trim() + suffix : input;
	}

	function binaryQuickSearch(_haystack, _needle, _array_position)
	{
// 		debug('needle: ' + _needle);
		try
		{
			var min = 0; 
			var max = _haystack.length-1;
			var m;
			
			while(true)
			{
// 				debug('haystack.length: ' + _haystack.length);
// 				debug('max: ' + max);
				
				if(max < min) 
				{
// 					debug('max < min');
					return;
				}

				m = (min + max) / 2
				
// 				debug('m: ' + m);
				
				if(_array_position)
					haystack_item = _haystack[m][_array_position];
				else
					haystack_item = _haystack[m];
				
// 				debug('haystack_item: ' + haystack_item);
				
				if(haystack_item < _needle)
					min = m + 1;
				else if(haystack_item > _needle)
					max = m - 1;
				else
					return haystack_item;
			}
		}
		catch(ex){debug(ex)}
	}

	function toMoney(n, decimals, decimal_sep, thousands_sep)
	{ 
	   var c = isNaN(decimals) ? 2 : Math.abs(decimals), //if decimal is zero we must take it, it means user does not want to show any decimal
	   d = decimal_sep || '.', //if no decimal separator is passed we use the dot as default decimal separator (we MUST use a decimal separator)
	
	   /*
	   according to [http://stackoverflow.com/questions/411352/how-best-to-determine-if-an-argument-is-not-sent-to-the-javascript-function]
	   the fastest way to check for not defined parameter is to use typeof value === 'undefined' 
	   rather than doing value === undefined.
	   */   
	   t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep, //if you don't want to use a thousands separator you can pass empty string as thousands_sep value
	
	   sign = (n < 0) ? '-' : '',
	
	   //extracting the absolute value of the integer part of the number and converting to string
	   i = parseInt(n = Math.abs(n).toFixed(c)) + '', 
	
	   j = ((j = i.length) > 3) ? j % 3 : 0; 
	   return sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : ''); 
	}
	
	function RemoveSelection() 
	{
		if (window.getSelection) // all browsers, except IE before version 9
		{  
			var selection = window.getSelection ();                                        
			selection.removeAllRanges ();
		}
		else 
		{
			if (document.selection.createRange) // Internet Explorer
			{
				var range = document.selection.createRange ();
				document.selection.empty ();
			}
		}
	}

	function sort_by(field, reverse, primer)
	{
	   var key = primer ? 
		   function(x) {return primer(x[field])} : 
		   function(x) {return x[field]};

	   reverse = [-1, 1][+!!reverse];

	   return function (a, b) {
		   return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
		 } 
	}
	
	function epochTimestamp()
	{
		if(Date.now) return Date.now();
		return new Date().getTime();
	}
	
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
	
	function sortArrayOnFirstItem(a, b){ return a[0]-b[0] }
	