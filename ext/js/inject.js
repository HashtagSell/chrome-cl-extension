//CONTENT.JS equiv

var qs = queryStringObject(),
	current_step = document.location.pathname+document.location.search;

//this is the listener for messages from the web page
window.addEventListener('message', function(event){

	//if the message didn't come from window or doesn't have a cmd -> exit
	if(event.source != window || !event.data.cmd) return;
	console.log('window.message -> event.data:', event.data);
	
	//if the cmd isn't a valid action -> exit
	if(!['create', 'delete', 'edit'].contains(event.data.cmd)) return;

	//send a notification to background to set the state
	chrome.runtime.sendMessage(event.data);

}, false);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log('listening to background.js -> request:', request);
	switch(request.fx)
	{
		case 'credsExist':
			return populateLoginForm(request);
	}
});


function populateLoginForm(request)
{
	console.log('populateLoginForm.request.data:', request.data);

	var login_form = $$$('form[name=login]'),
		input_username = $('inputEmailHandle'),
		input_password = $('inputPassword');

	console.log('populateLoginForm.login_form', login_form);

	if(request.data && !request.try_creds)
	{
		console.log('populateLoginForm -> fill in form');

		chrome.runtime.sendMessage({ 'cmd':'setTryCreds' });
		input_username.value = request.data.username;
		input_password.value = request.data.password;
		login_form.submit();
	}
	else
	{
		console.log('populateLoginForm -> listen to form');

		login_form.addEvent('submit', function(e){
			var username = input_username.value,
				password = input_password.value;

			console.log('username:', username);
			console.log('password:', password);

			//send these to the background
			//if the next page is the authed page, store in localstorage for the HTS username
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
}

function attachLogout()
{
	var a = $$$('a[href=https://accounts.craigslist.org/logout]');
	if(!a) return;
	a.addEvent('click', function(){
		chrome.runtime.sendMessage({ 'cmd' : 'resetState' })
	});
}

function displayError(text)
{
// 	if(!is_running) return;

	$DIV()
		.setStyles({
			'background' : 'rgba(255,0,0,.75)',
			'color' : '#fff',
			'width' : 'calc(100% - 40px)',
			'padding' : 20,
			'border' : '2px solid red'
		})
		.set('text', text || 'Sorry, there was an error auto-posting your item. Please finish it up manually.')
		.inject($$$('section.body'), 'top');
}

//get the state of the extension
chrome.runtime.sendMessage(
	{
		'cmd' : 'getState',
		'step' : current_step
	},
	function(state)
	{
		console.log('getState.state:', state);

		if(state.last_step == current_step)
		{
			console.log('getState.loopingPage -> breaking');
			chrome.runtime.sendMessage({ 'cmd' : 'resetState' });
			return displayError();
		}

		console.log('inject.getState.document.location:', document.location);
		if(document.location.hostname == 'accounts.craigslist.org')
		{
			switch(document.location.pathname.substring(1))
			{
				case 'login':
					chrome.runtime.sendMessage({ 'cmd' : 'triedCreds' });
					chrome.runtime.sendMessage({ 'cmd' : 'credsExist' });
					chrome.runtime.sendMessage({ 'cmd' : 'clearTempCreds' });
					break;

				case 'login/home':
					if(state.running && !state.last_step.contains('/login'))
						return chrome.runtime.sendMessage({ 'cmd' : 'resetState' });

					attachLogout();
					chrome.runtime.sendMessage({ 'cmd' : 'commitTempCreds' });
					chrome.runtime.sendMessage({ 'cmd' : 'resetTryCreds' });
					chrome.runtime.sendMessage({
						'cmd' : (state.mode == 'create') ? 'autoPostCreate' : 'autoPostModify'
					});

					break;

				case 'logout':
					chrome.runtime.sendMessage({ 'cmd' : 'resetState' });
					break;
			}
			return;
		}

		console.log('inject.getState.state.mode:', state.mode);
		var clp = new CraigslistAutoPoster(state);
		try {
			clp.run(qs.s);
		} catch(err) {
			console.log(err);
		}
	}
)