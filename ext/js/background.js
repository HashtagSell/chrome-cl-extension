var CraigslistExtension = function()
{
	var _this = this;
	
	this.is_running = false;
	this.current_step = null;
	this.is_editing = false;

	this.temp_creds = null;
	this.try_creds = false;

	this.craiglist_auth = null;
	this.active_tab = null;
	this.listing_meta = null;
	
	this.photo_count = 0;
    this.photo_limit = 24;

	this.clickedIcon = function()
	{
		_this.is_running = true;
		//get the listing_meta
		console.log('listingmeta', json_data);
		_this.listing_meta = json_data;
	
		_this.craiglist_auth = new CraigslistCredentials({
			'ext' : _this
		});
	}
	
	this.startAutoPosting = function()
	{
		_this.current_step = null;
		chrome.tabs.update(
			_this.active_tab.id, 
			{ url: 'https://post.craigslist.org/c/sfo?lang=en' },
			function(tab)
			{
				console.log('startAutoPosting.tab:', tab, tab.id);
			}
		);			
	}
	
	this.handleInjectMessages = function(request, sender, callback)
	{
		console.log('handleInjectMessages.request:', request);
		console.log('handleInjectMessages.is_running:', _this.is_running);
		
		switch(request.cmd)
		{
			// command from inject that receives a command from the webpage
			case 'create':
				_this.is_running = true;
				_this.listing_meta = request.data;
				_this.craiglist_auth = new CraigslistCredentials({
					'ext' : _this
				});
				break;

			case 'edit':
			case 'delete':
				console.log(request.cmd + ' listing');
				_this.is_running = request.cmd;
				_this.listing_meta = request.data;
				_this.craiglist_auth = new CraigslistCredentials({
					'ext' : _this
				});
				break;
			
			case 'getListingMeta':
				if(_this.current_step == request.step) return callback('inf.loop');
				_this.current_step = request.step;
				return callback(_this.listing_meta);

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
				callback('close');
				if(_this.is_running == true)
					_this.startAutoPosting();
				else if(_this.is_running == 'edit' || _this.is_running == 'delete')
				{
					console.log('edit/delete:', _this.listing_meta);
					chrome.tabs.update(
						_this.active_tab.id, 
						{ url: _this.listing_meta.craigslist['private']+'?s=edit' }, 
						function(tab)
						{
							console.log('edit/delete -> tab:', tab, tab.id);
						}
					);			
				}
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
}

var cl_ext = new CraigslistExtension();
chrome.runtime.onMessage.addListener(cl_ext.handleInjectMessages);
chrome.browserAction.onClicked.addListener(cl_ext.clickedIcon);