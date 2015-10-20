var CraigslistCredentials = function(attr)
{
	var _this = this;
	
	this.ext = attr.ext;

	this.promptForCreds = function()
	{
		chrome.tabs.create(
			{ url: 'https://accounts.craigslist.org/logout' },
			function(tab)
			{
				console.log('promptForCreds.tab:', _this.ext.listing_meta.username, tab, tab.id);
				_this.ext.active_tab = tab;

				chrome.tabs.update(
					tab.id, 
					{ url: 'https://accounts.craigslist.org/login' }, 
					function(tab)
					{
// 						console.log('startAutoPosting.tab:', tab, tab.id);
					}
				);			
			}
		);
	};

	this.putCreds = function()
	{
		var storage_data = {};
		storage_data[_this.ext.listing_meta.username] = _this.ext.temp_creds;
		
		console.log('putCreds.stored:', storage_data)
		chrome.storage.local.set(storage_data, function(){
			console.log('putCreds.stored:', storage_data)
		});
	};

	this.deleteCreds = function()
	{
		console.log('deleteCreds:', _this.ext.listing_meta.username)
		chrome.storage.local.remove(_this.ext.listing_meta.username, function(){
			console.log('deleteCreds.deleted:', _this.ext.listing_meta.username)
		});
	};

	this.getCreds = function(callback)
	{
		chrome.storage.local.get(_this.ext.listing_meta.username, function(result){
			console.log('CraigslistCredentials.checkStorage:', result);
			//creds !exist
			var creds = result[_this.ext.listing_meta.username];

			// send them back to inject to handle the page action
			console.log('calling back with creds:', creds);
			chrome.tabs.sendMessage(
				_this.ext.active_tab.id,
				{
					'fx' : 'credsExist',
					'data' : creds,
					'try_creds' : _this.ext.try_creds
				}
			);
			console.log('called back with creds:', creds);
		});
	};
	
	this.promptForCreds();
}