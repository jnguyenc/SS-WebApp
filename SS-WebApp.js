/*
needs 
npm install express
npm install request
npm install JSON
npm install simple-oauth2
*/

const PORT = 3000;

const request = require('request');
const express = require('express'), app = express();

// Check SmartThings SmartApp for these variables
const CLIENT_ID = '2768923c-e847-4843-9110-bdb9922bac95';
const CLIENT_SECRET = 'b592caf5-009d-472d-9345-155df2b10df1';

// Setting default API. Update API (/auth) to get current API variables
let	API_TOKEN = 'cb915d0c-f341-418c-a5a8-9a077949cd8c';
let	API_URI = 'https://graph-na02-useast1.api.smartthings.com/api/smartapps/installations/e9bdedc2-91ce-45a7-a945-c1cf975abc05';

// This callback URI for oAuth2 must be publicly accessible.
// Adjust SmartThings SmartApp, DNS, Port Forwarding, VirtualHost, and/or proxy accordingly.
const callback_uri = 'http://app.nguyen.dnset.com/callback';
// SmartThings Token Host
const token_host = 'https://graph.api.smartthings.com';
// This is the URI to get the endpoints once the API Token is received
const endpoints_uri = 'https://graph.api.smartthings.com/api/smartapps/endpoints';

// Setting up OAUTH
const oauth2 = require('simple-oauth2').create({
	client:{
		id: CLIENT_ID,
		secret: CLIENT_SECRET
	},
	auth:{
		tokenHost: token_host
	}
});

// Authorization URI definition 
const authorization_uri = oauth2.authorizationCode.authorizeURL({
	redirect_uri: callback_uri,
	scope: 'app',
	state: '3(#0/!~'
});

app.get('/auth', function (req, res){
	res.redirect(authorization_uri);
});
 
// Callback service parsing the authorization token and asking for the access token 
app.get('/callback', async function (req, res) {
	const code = req.query.code;
	//console.log('/callback got code: ' + code);
	const options = {
		code: code,
		redirect_uri: callback_uri
	};
  
	try {	  
		const result = await oauth2.authorizationCode.getToken(options);
		//console.log('The result: ', result);
		//const token = oauth2.accessToken.create(result);
		
		API_TOKEN = result.access_token;
    
		// Getting the endpoints
		const sendreq = {method: 'GET', uri: endpoints_uri + '?access_token=' + API_TOKEN};
		request(sendreq, function (err, ss_res, body){
			let endpoints = JSON.parse(body);
			API_URI = endpoints[0].base_url + endpoints[0].url;
			//console.log('Endpoint URI: ' + API_URI)
			//console.log('Access Token: ' + API_TOKEN);
			console.log('API variable updated.');
			res.redirect('/api');
		});
	}
	catch(error){
		console.log ('Access Token Error', error.message);
		return res.status(500).json('Authorization failed');
	}
});

app.get('/', function (req, res){
	/*
	let html = '<p><a href="/api">API</a></p>';
	html+= '<p><a href="/auth">Update API</a></p>';
	res.send(html);
	*/
	res.redirect('/api');
});

app.get('/api', function(req, res){
	let html = '<p>API Token: ' + API_TOKEN + '</p><p>API_URI: ' + API_URI + '</p>';
	const links = {'Update API':'/auth', 'Temps':'/temps', 'Motions':'/motions', 'Switches':'/switches', 'Switches On':'/switches/on', 'Switches Off':'/switches/off'};
	const html_link = '<p><a href="#alink#">#action#</a></p>';
	for(let key in links){
		let link = html_link.replace('#alink#', links[key]).replace('#action#', key);
		html += link;
	}
	res.send(html);
});

app.get('/temps', function(req, res){
	reqToSmartThings('/temps', res);
});

app.get('/motions', function(req, res){
	reqToSmartThings('/motions', res);
});

app.get('/switches', function(req, res){
	reqToSmartThings('/switches', res);
});

app.get('/switches/:action', function(req, res){
	//res.send(req.params.action);
	reqToSmartThings('/switches/' + req.params.action, res, 'PUT');	
});

function reqToSmartThings(action, res, method){
	method = method? method: 'GET';
	const url = API_URI + action + '?access_token=' + API_TOKEN;
	//console.log('Url: ' + url);
	//console.log('API Token: ' + API_TOKEN);
	const options = {  
		uri: url,
		method: method,
		headers: {
			'Authorization': 'Bearer ' + API_TOKEN,
		}
	};
	request(options, function (err, ss_res, body){
		if(body == ''){
			res.send('OK');
		}
		else{
			res.send(body);
			//console.log(body);
		}
	});
}

app.listen(PORT);
console.log('Express server started');