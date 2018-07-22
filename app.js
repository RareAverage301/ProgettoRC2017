var express = require('express');
var app = express();
var url = require('url');

// Moduli per effettuare la richiesta GET ai webserver
var https = require('https');

// Websocket per comunicare con il browser(client)
// Apertura del socket porta 4000
var WebSocket = require('ws');


// Moduli per la gestione della sessione
var session = require('express-session');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var memoryStore = require('memorystore')(session);
var sessionStore = new memoryStore();

// Link per oauth fb
var indirizzoServer = "192.168.1.219";
var appIdFb = '1590194347739475';
var clientSecretFb = '3aea791ef71442c9bb3d8f9347fb8946';
var loginLink = "https://www.facebook.com/v3.0/dialog/oauth?client_id="+appIdFb+"&auth_type=rerequest&scope=user_likes&redirect_uri=http://"+indirizzoServer+":8888/login&state=stato1234";
var accessTokenFb;
var apikeyNotizie = "2eab465040024561869ebc1d37a9d829";
app.use(cookieParser());
var sessionParser = session({store: sessionStore, secret: "Provachiavesegreta123"});
app.use(sessionParser);

var webSocketServer = new WebSocket.Server({verifyClient: (info, done) => {
	// Funzione che mi permette di accedere alle variabili di sessione
	// mentre comunico tramite websocket
	console.log("Parsing session from request..");
	sessionParser(info.req, {}, () => {
		console.log("Session parsed!");
		console.log(info.req.session);
		done(info.req.session.accessTokenFb);
	});
}, port: 4000});

// Globale
//global.arrayNotizie;
//global.indice;

// Accettazione connessione al server websocket
webSocketServer.on('connection', function connection(socket, req){
	socket.on('close', function(error){
		console.log("Socket chiuso: ");
	});
	socket.on('disconnect', function(error){
		console.log("Socket disconnesso: ");
	});
	socket.on('message', function(messaggio){
		console.log("Ricevuto messaggio è quello con l'accesstoken:");
		console.log(req.session.accessTokenFb);
		if ( req.session.accessTokenFb )
		{
			// Ottengo i 5 giochi che piacciono all'utente connesso
			var richiestaPagineGiochi = https.get("https://graph.facebook.com/me/?fields=games.limit(5)&access_token="+req.session.accessTokenFb);
			var datiPagine = "";
			richiestaPagineGiochi.on("response", function(response){
				// Un chunk (pezzo) di dati è stato ricevuto
				response.on('data', (chunk) => {
					datiPagine = datiPagine + chunk;
				});
				// Tutta la risposta è stata ricevuta
				response.on('end', () => {
					var indice = 0;
					console.log(datiPagine);
					var oggetto = JSON.parse(datiPagine);
					if ( !(oggetto.error) )
					{
						while ( indice < oggetto.games.data.length )
						{
							// Ottengo le notizie e le invio al browser relative al gioco
							console.log(sostituisciSpazi(oggetto.games.data[indice].name));
							var urlRichiestaNotizia = "https://newsapi.org/v2/everything?q="+sostituisciSpazi(oggetto.games.data[indice].name)+"&sortBy=publishedAt&sources=ign&language=en&pageSize=5&apiKey="+apikeyNotizie;
							var richiestaNotizia = https.get(urlRichiestaNotizia);
							richiestaNotizia.on("response", function(response){
								var datiNotizia = "";
								// Un chunk (pezzo) di dati è stato ricevuto
								response.on('data', (chunk) => {
									datiNotizia = datiNotizia + chunk;
								});
								// Tutta la risposta è stata ricevuta
								response.on('end', () => {
									console.log(datiNotizia);
									socket.send(datiNotizia);
								});
							});
							indice = indice + 1;
						}
					}
					else
					{
						// Errore durante l'ottenimento delle pagine che piacciono all'utente
					}
				});
			});
			// Successivamente ricerco per ogni gioco 5 articoli relativi ad essi
			// e li restituisco tramite websocket al browser per renderizzarli
			
			var indice = 0;
			
		}
		else
		{
			// Nessun token, non dovrei entrare qui teoricamente
		}
	});
	

	//console.log(req);
	//console.log(req.rawHeaders);
	/*console.log(req.headers.cookie);
	// Session id cifrato è in rawHeaders: Cookie : -as.dsada
	var sidCifrato = ottieniSid(req.headers.cookie);
	console.log(sidCifrato);
	
	var sid = cookieParser.signedCookie(sidCifrato, "Provachiavesegreta123");
	console.log(sid);
	sessionStore.get(sid, function(error, session){
		console.log(session);
	});
	// Ho il sid, vado a leggere dal 
	//console.log("Access token fb richiedendo /notizie: "+ req.session.accessTokenFb);*/
	
});

function ottieniSid(cookie)
{
	var posizione = cookie.indexOf('=');
	return decodeURI(cookie.substr(posizione+1+4));
}

// Funzione per ottenere la root del server
app.get("/", function(req, res){
	//res.send("Wewew");
	// Se non sono autenticato
	if ( !(req.session.accessTokenFb != null) )
	{
		// Restituisce pagina con login con facebook
		console.log("Non sono autenticato");
		res.redirect(loginLink);
	}
	else
	{
		// Altrimenti sono autenticato e mostro le notizie
		res.redirect("/notizie");
		console.log("Sono autenticato");
		console.log(req.session.accessTokenFb);
		//console.log(req.session.accessTokenNotizie);
	}
});

app.get("/login", function(req, res){
	// Ottengo il codice (OAUTH FB) dalla querystring
	if ( req.query.code ) 
	{
		// Richiesta token d'accesso
		var accessTokenUrl = "https://graph.facebook.com/v3.0/oauth/access_token?client_id="+appIdFb+"&redirect_uri=http://"+indirizzoServer+":8888/login&client_secret="+clientSecretFb+"&code="+req.query.code;
		console.log("Codice ricevuto!");
		data = '';
		
		var richiestaAccessToken = https.get(accessTokenUrl);
		richiestaAccessToken.risultatoOauth = res;
		richiestaAccessToken.richiestaOauth = req;
		data = '';
		richiestaAccessToken.on("response", function(response){
			// Un chunk (pezzo) di dati è stato ricevuto
			response.on('data', (chunk) => {
				data = data + chunk;
			});
			// Tutta la risposta è stata ricevuta
			response.on('end', () => {
				var rispostaJsonFb = JSON.parse(data);
				//console.log(rispostaJsonFb);
				req.session.accessTokenFb = rispostaJsonFb.access_token;
				console.log("Access token memorizzato");
				//console.log(res);
				//richiestaAccessToken.prova.sendFile("notizie.html", {"root": __dirname });
				richiestaAccessToken.risultatoOauth.redirect("/notizie");
			});
		});
	}
	else
	{
		// Altrimenti non ho il codice
		res.send("Nessun codice nella querystring oppure errore");
		req.session.accessTokenFb = null;
		console.log("Nessun codice nella querystring oppure errore\n");
	}
});

//global.incremento = 0;

// Restituisce la pagina di notizie che andrà a leggere
// dal websocket le notizie ricevute dall'api rest newsapi.org
app.get("/notizie", function(req, res){
	if ( req.session.accessTokenFb )
	{
		res.sendFile('notizie.html', {"root": __dirname });
		console.log("mando pagina");
		
	}
	else
	{
		console.log("Non ho autorizzazione");
		res.redirect("/");
	}
});

function sostituisciSpazi(stringa)
{
	var i = 0;
	var nuovaStringa = "";
	while (i < stringa.length)
	{
		if ( stringa.charAt(i) == " " )
		{
			nuovaStringa = nuovaStringa + "+";
		}
		else
		{
			nuovaStringa = nuovaStringa + stringa.charAt(i);
		}
		i = i + 1;
	}
	return nuovaStringa;
}

function riceviNotizie(pagine, socket)
{
	console.log("Socket in riceviNotizie: "+socket.readyState);
	if ( pagine.length > 0 && socket.readyState == 1 )
	{
		// Richiedo per ogni gioco notizie su IGN 
		var urlRichiestaNotizia = "https://newsapi.org/v2/everything?q="+sostituisciSpazi(pagine[0].name)+"&sortBy=publishedAt&sources=ign&language=en&pageSize=5&apiKey="+apikeyNotizie;
		var richiestaNotizia = https.get(urlRichiestaNotizia);
		//console.log("Richiedo -->"+oggetto.games.data[0].name);
		//console.log("Richiedo -->"+sostituisciSpazi(pagine[0].name));
		socket.data = "";
		richiestaNotizia.on("response", function(response){
			// Un chunk (pezzo) di dati è stato ricevuto
			response.on('data', (chunk) => {
				socket.data = socket.data + chunk;
			});
			// Tutta la risposta è stata ricevuta
			response.on('end', () => {
				console.log("Parso JSON");
				console.log(socket.data);
				/*var oggetto = JSON.parse(socket.data);
				//console.log("Notizia ricevuta!");
				//console.log(oggetto);
				//notizie.push(oggetto);
				//console.log("Scrivo sulla socket");
				// Scrivo su socket le notizie
				console.log("Socket prima di scrivere i dati in riceviNotizie: "+socket.readyState);
				if ( socket.readyState == 1 )
				{
					socket.send(socket.data);						
					// Levo la prima pagina
					pagine.shift();
					// Passo a quella successiva
					riceviNotizie(notizie, pagine, socket);
				}
				else
				{
					console.log("il socket è stato chiuso poco prima della scrittura");
				}*/
			});
		});
	}
	else
	{
		console.log("Pagine finite");
		socket.close();
	}
}

// Application server in ascolto alla porta 8888
app.listen(8888);
console.log("Server in ascolto: porta 8888");
