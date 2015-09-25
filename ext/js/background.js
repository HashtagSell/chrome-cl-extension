var is_running = false;

// login URL
// https://accounts.craigslist.org/login

//kick off the extension and send a message to the inject.js
chrome.browserAction.onClicked.addListener(function(){
	// The event page will unload after handling this event (assuming nothing
	// else is keeping it awake). The content script will become the main way to
	// interact with us.
	is_running = true;
	chrome.tabs.create(
		{ url: 'https://post.craigslist.org/c/sfo?lang=en' }, 
		function(tab)
		{
			console.log('tab:', tab, tab.id);
			chrome.tabs.sendMessage(tab.id, 'inject');
			console.log('sent message', tab.id);
		}
	);
});

//listen for messages coming from the inject.js
chrome.runtime.onMessage.addListener(function(request, sender, callback){
	console.log('message from inject.js -> request:', request);
// 	console.log('message from inject.js -> sender:', sender);
	
	switch(request.cmd)
	{
		case 'isRunning':
			console.log('is_running:', is_running);
			return callback(is_running || is_running == request.path);
		case 'getActiveURL':
			console.log('is_running:', is_running);
			return callback(is_running);
		case 'putActiveURL':
			is_running = request.path;
			break;
		case 'doneRunning':
			is_running = false;
			break;
	}
});
