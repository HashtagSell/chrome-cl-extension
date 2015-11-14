var CraigslistExtension = function()
{
	var _this = this;
	
	this.is_running = false;
	this.listing_cmd = null;
	this.current_step = null;
	this.is_editing = false;

	this.temp_creds = null;
	this.try_creds = false;

	this.craiglist_auth = null;
	this.active_tab = null;
	this.listing_meta = null;
	
	this.photo_count = 0;
    this.photo_limit = 24;
    
    this.state = null;
	
	//take the user to HTS on clicking of the icon
	this.clickedIcon = function()
	{
		chrome.tabs.create({ url: 'http://hashtagsell.com' })
	}
	
	this.locateListing = function()
	{
		var listing = _this.state.listing,
			listing_coords = listing.geo.coordinates;
		listing_coords.reverse();
		console.log('listing_coords:', listing_coords);

		var distances = HTS_CL_POINTS.map(function(p){
			return [haversine(listing_coords, p.slice(0,2)), p]
		});

		distances.sort(sortArrayOnFirstItem);
// 		console.log(JSON.encode(listing.location), JSON.encode(distances[0]));
		
		_this.state.listing.clLocation = distances[0][1].slice(2);
	}

	this.mapCategoryCode = function()
	{
		var data = _this.state.listing,
			cat = HTS_CL_CATEGORIES[data.categoryCode];
		_this.state.listing.clCategoryCode = cat;
	}
	
	this.startAutoPosting = function()
	{
		_this.current_step = null;
		chrome.tabs.update(
			_this.active_tab.id, 
			{ url: 'https://post.craigslist.org/c/'+_this.state.listing.clLocation[0]+'?lang=en' }
		);			
	}
	
	this.resetState = function(attr)
	{
		_this.state = attr || {
			'running' : false,
			'mode' : null,
			'listing' : null,
			'last_step' : null
		}
	}
	
	this.handleTabClose = function(tabId, removeInfo)
	{
		if(_this.active_tab.id != tabId) return;
		_this.resetState();
	}
	
	this.handleInjectMessages = function(request, sender, callback)
	{
		console.log('handleInjectMessages.request:', request);
		
		switch(request.cmd)
		{
			case 'getState':
				callback(Object.clone(_this.state));
				if(_this.state.running)
					_this.state.last_step = request.step;
				break;

			case 'resetState':
				return _this.resetState();

			// command from inject that receives a command from the webpage
			case 'create':
			case 'edit':
			case 'delete':
				_this.resetState({
					'running' : true,
					'mode' : request.cmd,
					'listing' : request.data,
					'last_step' : null
				});
				_this.mapCategoryCode();
				_this.locateListing();
				_this.craiglist_auth = new CraigslistCredentials(_this);
				break;
			
			case 'getListingMeta':
				console.log('handleInjectMessages.getListingMeta._this.current_step:', _this.current_step);
				console.log('handleInjectMessages.getListingMeta.request.step:', request.step);
				if(_this.current_step == request.step)
				{
					console.log('handleInjectMessages.getListingMeta -> inf.loop');
					return callback('inf.loop');
				}
				_this.current_step = request.step;
				
				var ret = Object.clone(_this.listing_meta);
				ret.clCommand = _this.listing_cmd;

				return callback(ret);

			case 'isRunning':
				return callback(_this.is_running || _this.is_running == request.path);

			case 'getActiveURL':
				return callback(_this.is_running);

			case 'putActiveURL':
				_this.is_running = request.path;
				console.log('handleInjectMessages.putActiveURL.is_running:', _this.is_running);
				
				if(request.path == false)
				{
					chrome.tabs.update(
						_this.active_tab.id, 
						{ url: 'https://accounts.craigslist.org/logout' }
					);			
				}
				
				return callback(_this.is_running || _this.is_running == request.path);

			case 'doneRunning':
				_this.is_running = false;
				_this.current_step = null;
				break;

			case 'credsExist':
				console.log('credsExist');
				_this.craiglist_auth.getCreds();
				break;

			case 'storeTempCreds':
				_this.temp_creds = request.creds;
				console.log('STORE.temp_creds:', _this.temp_creds);
				break;

			case 'clearTempCreds':
				_this.temp_creds = null;
				console.log('CLEAR.temp_creds:', _this.temp_creds);
				break;

			case 'commitTempCreds':
				if(_this.temp_creds)
				{
					console.log('COMMIT.temp_creds:', _this.temp_creds);
					_this.craiglist_auth.putCreds(_this.temp_creds);
				}
				return callback('close');

			case 'autoPostCreate':
				return _this.startAutoPosting();

			case 'autoPostModify':
				chrome.tabs.update(
					_this.active_tab.id, 
					{ url: _this.state.listing.craigslist['private']+'?s=edit' }
				);
				break;

			case 'editedText':
				_this.state.edittext = true;
				break;

			case 'editedPics':
				_this.state.editpics = true;
				break;

			case 'setTryCreds':
				_this.try_creds = true;
				break;
			case 'resetTryCreds':
				_this.try_creds = false;
				break;
			case 'triedCreds':
				if(_this.try_creds)
				{
					console.log('triedCreds -- failed auth -- clear creds from localstorage');
					_this.craiglist_auth.deleteCreds();
				}
				_this.try_creds = false;
				break;
		}
	}

	this.checkVersion = function(request, sender, sendResponse) {
		if (request) {
			if (request.message) {
				if (request.message == "version") {
					var manifest = chrome.runtime.getManifest();
					sendResponse(manifest.version);
				}
			}
		}
		return true;
	}
	
	_this.resetState();
}

var cl_ext = new CraigslistExtension();

//this listens for messages from inject
chrome.runtime.onMessage.addListener(cl_ext.handleInjectMessages);

//this watches the button in the chrome's chrome
chrome.browserAction.onClicked.addListener(cl_ext.clickedIcon);

//this watches for the tab to close
chrome.tabs.onRemoved.addListener(cl_ext.handleTabClose);

//this listens for request to check version of extension from external application
chrome.runtime.onMessageExternal.addListener(cl_ext.checkVersion);