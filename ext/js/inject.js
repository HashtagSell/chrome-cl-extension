//CONTENT.JS equiv
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log('listening to background.js -> request:', request);
	
	switch(request.fx)
	{
		case 'credsExist':
			console.log('request.data', request.data);

			var login_form = $$$('form[name=login]'),
				input_username = $('inputEmailHandle'),
				input_password = $('inputPassword');

			console.log('login_form', login_form);

			if(request.data && !request.try_creds)
			{
				console.log('fill in form');
				chrome.runtime.sendMessage({ 'cmd':'setTryCreds' });
				input_username.value = request.data.username+'12345';
				input_password.value = request.data.password;
				login_form.submit();
			}
			else
			{
				//if so, populate and post
				//else set up for capturing creds
				console.log('listen to form');

				login_form.addEvent('submit', function(e){
					var username = input_username.value,
						password = input_password.value;

					console.log('username:', username);
					console.log('password:', password);
		
					//send these to the background. if the next page is the authed page, store in localstorage for the #sell username
					chrome.runtime.sendMessage(
						{
							'cmd':'storeTempCreds',
							'creds' : {
								'username' : username,
								'password' : password
							}
						}
					);
				});
			}
			break;
	}
	
});

var is_running = false,
	qs = queryStringObject();

function putActiveURL(path)
{
	chrome.runtime.sendMessage({
		'cmd' : 'putActiveURL',
		'path' : path
	});
}

var CraigslistAutoPoster = function()
{
	var _this = this;
	
	this.selectRadioInput = function(v)
	{
		var input = $$('form.picker input').filter(function(i){ return i.value == v });
		console.log('input:', input);
		input.set('checked', true)
		return input
	}
	
	//fso is for sale by owner
	this.selectFSBO = function()
	{
		_this.selectRadioInput('fso');
		_this.submit();
	}

	//96 is electronics
	this.selectCategory = function()
	{
		_this.selectRadioInput('96');
		_this.submit();
	}

	//1 is San Francisco
	this.selectSubarea = function()
	{
		_this.selectRadioInput('1');
		_this.submit();
	}

	//0 is bypass hood
	this.selectHood = function()
	{
		_this.selectRadioInput('0');
		_this.submit();
	}

	this.populateListing = function()
	{
		$('PostingTitle').value = json_data.heading;
		$('Ask').value = toMoney(json_data.askingPrice.value);
		$('postal_code').value = json_data.location.postalCode;
		
		var body = $DIV().set('html', json_data.body);
		$('PostingBody').value = body.get('text');
		
		json_data.annotations.each(function(a){
			//skip annotations without values
			if(!a.value) return;
			
			switch(a.key.toLowerCase())
			{
				case 'brand':
			 		$('sale_manufacturer').value = a.value;
			 		break;
				case 'model':
			 		$('sale_model').value = a.value;
			 		break;
			}
		});
		
		//now do the 'want a map'
		var loc = json_data.location;
		if(loc.city && loc.state)
		{
	 		$('city').value = loc.city;
	 		$('region').value = loc.state;
			if(loc.street1) $('xstreet0').value = loc.street1;
	 		$('wantamap').set('checked', true);
		}

		$$$('input[name=sale_condition]').getPrevious('select').selectedIndex = 4;
		$('postingForm').submit();
	}

	// geoverify -- shows up only when the 'want a map' option os selected in populateListing
	this.geoverify = function()
	{
		$('leafletForm').submit()
	}
	
	this.populatePhotos = function()
	{
		$$$('button.done').getParent('form').submit()
	}

	this.preview = function()
	{
		$$$('button[type=submit]').getParent('form').submit()
	}
	
	//this is the DONE step
	this.redirect = function()
	{
		putActiveURL(false);
	}

	this.submit = function()
	{
		$$$('form.picker').submit();
	}
	
	this.run = function(step)
	{
		({
			'type' : 		_this.selectFSBO,
			'cat' : 		_this.selectCategory,
			'subarea' : 	_this.selectSubarea,
			'hood' : 		_this.selectHood,
			'edit' : 		_this.populateListing,
			'geoverify':	_this.geoverify,
			'editimage' : 	_this.populatePhotos,
			'preview' : 	_this.preview,
			'redirect' : 	_this.redirect
		})[step]()
	}
}

if(document.location.toString() == 'https://accounts.craigslist.org/login')
{
	console.log('https://accounts.craigslist.org/login');
	
	// send a message to the background and see if there're creds for the user
	chrome.runtime.sendMessage({ 'cmd':'triedCreds' });
	chrome.runtime.sendMessage({ 'cmd':'credsExist' });
	chrome.runtime.sendMessage({ 'cmd':'clearTempCreds' });
}
else if(document.location.toString() == 'https://accounts.craigslist.org/login/home')
{
	chrome.runtime.sendMessage({ 'cmd':'commitTempCreds' });
	chrome.runtime.sendMessage({ 'cmd':'resetTryCreds' });
}
else
{
	chrome.runtime.sendMessage(
		{
			'cmd':'isRunning',
			'path' : document.location.pathname
		}, 
		function(response)
		{
			console.log('chrome.runtime.sendMessage.isRunning.repsonse:', response);
			is_running = response;
			console.log('is_running:', is_running);

			if(is_running == false) return;

			if(is_running == true && qs.s == 'type')
			{	
				is_running = document.location.pathname;
				putActiveURL(is_running);
			}

			if(is_running != document.location.pathname)
				return putActiveURL(false);

			console.log('init CraigslistAutoPoster');
			console.log('qs', qs);

			var clp = new CraigslistAutoPoster();
			clp.run(qs.s);
		}
	);
}