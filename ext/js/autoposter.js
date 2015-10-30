var CraigslistAutoPoster = function(state, step)
{
	var _this = this;
	var json_data = state.listing;
	this.state = state;
	
	if(!json_data) return console.log('CraigslistAutoPoster.!json');

	console.log('CraigslistAutoPoster -> go');

	this.image_queue = Array.clone(json_data.images);
	this.image_buffers = {};
	
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

	this.selectCategory = function()
	{
// 		console.log('selectCategory.json_data:', json_data);
		var cat = json_data.clCategoryCode;
		console.log('selectCategory.cat:', cat);
		if(!cat)
			return displayError('Sorry, we could not auto-choose the appropriate category for your item. Please select one to continue.');
		
		_this.selectRadioInput(cat.toString());
		_this.submit();
	}

	this.selectSubarea = function()
	{
		_this.selectRadioInput(json_data.clLocation[3]);
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
		if(['delete', 'edit'].contains(_this.state.mode)) 
		{
			$$$('button[type=submit]', $('postingForm')).addEvent('click', function(e){
// 				putActiveURL('edited');
			});
		}

		$('PostingTitle').value = json_data.heading;

		if(json_data.askingPrice && json_data.askingPrice.value)
			$('Ask').value = toMoney(json_data.askingPrice.value);

		if(json_data.location && json_data.location.postalCode)
			$('postal_code').value = json_data.location.postalCode;
		
		var body = $DIV().set('html', json_data.body.trim());
		
		//append the annotations
		if(json_data.annotations && json_data.annotations.length)
		{
			var ul = $UL();
			body.adopt(ul);
			json_data.annotations.each(function(annotation){
				if(!annotation.value || !annotation.value) return;
				ul.adopt(
					$LI().set('html', annotation.key + ': ' + annotation.value)
				);
			});
		}
		
		$('PostingBody').value = body.get('html');
		
		if(json_data.annotations)
			json_data.annotations.each(function(a){
				//skip annotations without values
				if(!a.value) return;

				var field_key = a.key.toLowerCase();
				console.log('field.key:', field_key);

				var field_id = {
					'brand': 'sale_manufacturer',
					'make': 'auto_make_model',
					'model': ['sale_model', 'auto_make_model'],
					'fuel' : 'auto_fuel_type',
					'transmission' : 'auto_transmission',
					'vin' : 'auto_vin',
					'mileage' : 'auto_miles',
					'exterior color' : 'auto_paint',
					'body type' : 'auto_bodytype'
				}[field_key];

				console.log('field.field_id:', field_id);
				console.log('field.field_id.type:', typeOf(field_id));
				
				if(!field_id) 
					return;
				else if(typeOf(field_id) != 'array') 
					field_id = [field_id];

				var field;
				field_id.each(function(f){
					console.log('getting field:', f);
					field = $(f);
					console.log('getting field.field:', field);
					if(field) return false;
				});
				
				console.log('field.field:', field);

				if(!field) return;
				
				switch(field.get('tag'))
				{
					case 'select':
						console.log('switch.select');
						var val = a.value.toLowerCase().substring(0,3),
							other;

						field.getElements('option').each(function(o){
							var option = o.get('text');
							console.log('option.val:', val, option);
							if(option.substring(0,3) == val)
							{
								o.set('selected', true);
								return false;
							}
							if(option == 'other') other = o;
						});
						break;
					case 'input':
					default:
						console.log('switch.default');
						field.value = (field.value) ? [field.value, a.value].join(' ') : a.value;
						break;
				}
			});
		
		//now do the 'want a map'
		if(json_data.location)
		{
			var loc = json_data.location;
			if(loc.city && loc.state)
			{
				$('city').value = loc.city;
				$('region').value = loc.state;
				if(loc.street1) $('xstreet0').value = loc.street1;
				$('wantamap').set('checked', true);
			}
		}

		$$$('input[name=sale_condition]').getPrevious('select').selectedIndex = 4;

		if(_this.state.mode == 'edit')
			chrome.runtime.sendMessage({ 'cmd' : 'editedText' });

		$('postingForm').submit();
	}

	// geoverify -- shows up only when the 'want a map' option os selected in populateListing
	this.geoverify = function()
	{
		$('leafletForm').submit()
	}
	
	this.getModifyButton = function(editforms_selector, filter_fx)
	{
		console.log('CraigslistAutoPoster.getModifyButton.editforms_selector:', editforms_selector);
		var editforms = $$(editforms_selector);
		console.log('CraigslistAutoPoster.getModifyButton.editforms:', editforms);
		if(!editforms.length) return;

		var form = editforms.filter(filter_fx);

		console.log('CraigslistAutoPoster.getModifyButton.form:', form);
		if(!form.length) return;
		return form[0];
	}
		
	// disabled for create -> per https://github.com/HashtagSell/chrome-cl-extension/issues/11
	this.preview = function()
	{
		console.log('CraigslistAutoPoster.preview:', _this.state.mode, _this.state.running);

		if(['delete', 'edit'].contains(_this.state.mode))
		{
			var edit_btn = 'edit text';
			if(_this.state.mode == 'edit')
			{
				if(_this.state.edittext) edit_btn = 'edit images';
				if(_this.state.edittext && _this.state.editpics) return;
			}

			var button_value = (_this.state.mode == 'delete') ? 'cancel edit' : edit_btn,
				checkpath = document.location.href.split('?')[0],
				form = _this.getModifyButton(
					'form[action='+checkpath+']',
					function(f){
						return $$$('button[type=submit]', f).value.toLowerCase() == button_value
					}
				);

			if(!form) return _this.cancel();
			return form.submit()
		}
	}
	
	//this is the DONE step
	this.redirect = function()
	{
		//get all the hrefs on the page
		//if the text == the href -> public url
		//if the text contains 'manage your post' -> edit/delete url
		var listing_urls = {
			'private' : null,
			'public' : null
		};
		
		$$('a').each(function(a){
			var href = a.get('href')
			if(a.get('text') == href)
				listing_urls['public'] = href;
			else if(a.get('text').toLowerCase().contains('manage'))
				listing_urls['private'] = href;
		});

		//send the manage url to the backend
		console.log('inject.redirect.listing_urls:', listing_urls);
		new Request({
			url: 'https://staging.hashtagsell.com/v1/postings/'+json_data.postingId+'/publish',
			method : 'POST',
			urlEncoded : false,
			headers : { 'Content-Type' : 'application/json' },
			data : JSON.encode({ 'craigslist' : listing_urls }),
			onComplete: function(response)
			{
				console.log('inject.redirect.listing_urls.response: ', response);
				_this.cancel();
			}
		}).send();
	}

	this.submit = function()
	{
		$$$('form.picker').submit();
	}
	
	this.cancel = function()
	{
		chrome.runtime.sendMessage({ 'cmd' : 'resetState' })
	}
	
	this.run = function(step)
	{
		console.log('CraigslistAutoPoster.run.step:', step);
		console.log('CraigslistAutoPoster.run.json_data:', json_data);

		var steps = {
			'type' : 		_this.selectFSBO,
			'cat' : 		_this.selectCategory,
			'subarea' : 	_this.selectSubarea,
			'hood' : 		_this.selectHood,
			'edit' : 		_this.populateListing,
			'geoverify':	_this.geoverify,
			'editimage' : 	_this.populatePhotos,
			'preview' : 	_this.preview,
			'redirect' : 	_this.redirect
		}
		var s = steps[step];
		console.log('CraigslistAutoPoster.run.s:', s);

		if(!s && ['edit', 'delete'].contains(_this.state.mode))
		{
			var selector = (_this.state.mode == 'edit') ? 'edittext' : 'delete',
				form = _this.getModifyButton(
					'form[action='+document.location.pathname+']',
					function(f){
						return $$$('input[value='+selector+']', f) != undefined
					}
				);

			if(!form) return _this.cancel();
 			return form.submit();
		}
		
		console.log('CraigslistAutoPoster.run -> s():', s);
		s()
	}
	
	this.populatePhotos = function()
	{
		if(_this.state.mode == 'edit')
		{
			$$('div.images form.delete.ajax button[type=submit]').each(function(btn){
				btn.click()
			});
		}

		var div_posting = $$$('section.body div.posting'),
			size = div_posting.getSize(),
			div = $DIV()
				.setStyles({
					'position' : 'absolute',
					'z-index' : 10000,
					'background' : 'rgba(0,0,0,.75)',
					'color' : '#fff',
					'width' : size.x,
					'height' : size.y,
					'margin-top' : -(div_posting.getStyle('padding-top').toInt()+2),
					'margin-left' : -(div_posting.getStyle('padding-left').toInt()+2)
				})
				.adopt(
					$H1().setStyles({
						'position' : 'absolute',
						'width' : 250,
						'left' : 'calc(50% - 125px)',
						'top' : '45%'
					}).set('text', 'Uploading photos...')
				);

		div.inject(div_posting, 'top');
		
		if(!_this.image_queue.length)
			return $$$('button.done').getParent('form').submit();
		
		_this.image_queue.each(function(img, i){ 
			_this.getImageFromHashtagSell(img.full, i) 
		})
	}
	
	this.getImageFromHashtagSell = function(url, idx)
	{
		console.log('getImage:', url);
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		// Response type arraybuffer - XMLHttpRequest 2
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) 
		{
// 			if(xhr.status == 200) _this.uploadImage(xhr.response, url);
			_this.image_queue[idx] = null;
			if(xhr.status == 200)
				_this.image_buffers[url] = xhr.response;
			
			var wkg_img_queue = _this.image_queue.filter(function(q){ return q != null });
			if(wkg_img_queue.length == 0 && Object.getLength(_this.image_buffers) > 0)
				_this.uploadImagesToCraigslist();
		};
		
		xhr.send();
	}
	
	this.uploadImagesToCraigslist = function()
	{
		console.log('uploadImagesToCraigslist --- start');

		var xhr = new XMLHttpRequest(),
			doc = document,
			form = doc.forms[0],
			elems = form.elements,
			url = [doc.location.origin, doc.location.pathname].join('');

		console.log('uploadImagesToCraigslist.url:', url);

		var form_data = new FormData();
		form_data.append('name',  'tmpfile'+ _this.photo_count +'.jpg');
		form_data.append(elems[0].name, elems[0].value);
		form_data.append('ajax',  '1');
		form_data.append('a', 'add');

		json_data.images.each(function(img, i){
			var ab = _this.image_buffers[img.full];
			if(!ab) return;
			form_data.append( 'file', new Blob([ab], {type: "image/jpeg"}), 'tmpfile'+ i +'.jpg' )
		});
// 		form_data.append( 'file', new Blob([arrayBuffer], {type: "image/jpeg"}), 'tmpfile'+ _this.photo_count+1 +'.jpg' );

		xhr.open('POST', url, true);
		xhr.onload = function(e)
		{
			if(xhr.status == 200)
			{
				console.log('uploadImagesToCraigslist -> DONE!');

				if(_this.state.mode == 'edit')
					chrome.runtime.sendMessage({ 'cmd' : 'editedPics' });

				$$$('button.done').getParent('form').submit()
			}
			else
				return alert('Problem uploading images');
		};
		xhr.ontimeout = function(e)
		{
			console.log('uploadImagesToCraigslist -> ERROR: TIMEOUT');
		};
		xhr.onerror = function(e)
		{
			console.log('uploadImagesToCraigslist -> ERROR: ONERROR');
		};

		console.log('uploadImagesToCraigslist -> sending..');
		xhr.send(form_data);
	}
}
