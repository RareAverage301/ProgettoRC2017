var express = require('express');
var app = express();


// Moduli per effettuare la richiesta GET ai webserver
var https = require('https');

// Websocket per comunicare con il browser(client)
// Apertura del socket porta 4000
var WebSocket = require('ws');
var webSocketServer = new WebSocket.Server({port: 4000});

// Moduli per la gestione della sessione
var session = require('express-session');
var cookieParser = require('cookie-parser');

// Link per oauth fb
var appIdFb = '1590194347739475';
var clientSecretFb = '3aea791ef71442c9bb3d8f9347fb8946';
var loginLink = "https://www.facebook.com/v3.0/dialog/oauth?client_id="+appIdFb+"&redirect_uri=http://localhost:8888/login&state=stato1234";
var accessTokenFb;
var apikeyNotizie = "2eab465040024561869ebc1d37a9d829";
app.use(cookieParser());
app.use(session({secret: "Provachiavesegreta123"}));

// Globale
//global.arrayNotizie;
//global.indice;

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
		var accessTokenUrl = "https://graph.facebook.com/v3.0/oauth/access_token?client_id="+appIdFb+"&redirect_uri=http://localhost:8888/login&client_secret="+clientSecretFb+"&code="+req.query.code;
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
				console.log(rispostaJsonFb);
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
		req.session.accessTokenNotizie = null;
		console.log("Nessun codice nella querystring oppure errore\n");
	}
});


// Restituisce la pagina di notizie che andrà a leggere
// dal websocket le notizie ricevute dall'api rest newsapi.org
app.get("/notizie", function(req, res){
	if ( req.session.accessTokenFb )
	{
		res.sendFile('notizie.html', {"root": __dirname });
		// Apertura webserver socket
		webSocketServer.on('connection', function connection(socket){
			socket.on('close', function(error){
				console.log("Client disconnesso");
			});
			console.log("Client connesso al WebSocket");
			// Ottengo le pagine relative ai giochi che piacciono all'utente
			richiestaPagineGiochi = https.get("https://graph.facebook.com/me/?fields=games.limit(5)&access_token="+req.session.accessTokenFb);
			richiestaPagineGiochi.risultatoNotizie = res;
			richiestaPagineGiochi.richiestaNotizie = req;
			richiestaPagineGiochi.socketWeb = socket;
			data = '';
			richiestaPagineGiochi.on("response", function(response){
				// Un chunk (pezzo) di dati è stato ricevuto
				response.on('data', (chunk) => {
					data = data + chunk;
				});
				// Tutta la risposta è stata ricevuta
				response.on('end', () => {
					var oggetto = JSON.parse(data);
					console.log("Oggetto ottenuto api facebook");
					console.log(oggetto);
					if ( !(oggetto.error) )
					{
						//res.sendFile('notizie.html', {"root": __dirname });
						console.log("Richiedo notizie");
						// L'oggetto non contiene errori quindi avrò le mie informazioni
						//var indice = 0;
						arrayNotizie = [];
						//global.indice = 0;
						// Invio il numero di pagine che ho
						socket.send(oggetto.games.data.length);
						// Se il numero di pagine è maggiore di 0, ricerco gli articoli dei giochi 
						if ( oggetto.games.data.length > 0 )
						{					
							
							// Funzione per scrivere nell'array le notizie
							riceviNotizie(arrayNotizie, oggetto.games.data, richiestaPagineGiochi.socketWeb);
							
							//console.log(arrayNotizie);
						}
						else
						{
							// Non ci sono giochi
							console.log("Non ci sono giochi");
						}
					}
					else
					{
						console.log("Errore oggetto api facebook");
						richiestaPagineGiochi.risultatoNotizie.redirect("/");
					}
				});
			});
			console.log("Access token fb richiedendo /notizie: "+ req.session.accessTokenFb);
		});
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

function riceviNotizie(notizie, pagine, socket)
{
	if ( pagine.length > 0 )
	{
		// Richiedo per ogni gioco notizie su IGN 
		var urlRichiestaNotizia = "https://newsapi.org/v2/everything?q="+sostituisciSpazi(pagine[0].name)+"&sortBy=publishedAt&sources=ign&language=en&pageSize=5&apiKey="+apikeyNotizie;
		var richiestaNotizia = https.get(urlRichiestaNotizia);
		//console.log("Richiedo -->"+oggetto.games.data[0].name);
		console.log("Richiedo -->"+sostituisciSpazi(pagine[0].name));
		data = "";
		richiestaNotizia.on("response", function(response){
			// Un chunk (pezzo) di dati è stato ricevuto
			response.on('data', (chunk) => {
				data = data + chunk;
			});
			// Tutta la risposta è stata ricevuta
			response.on('end', () => {
				console.log("Parso JSON");
				var oggetto = JSON.parse(data);
				console.log("Notizia ricevuta!");
				//console.log(oggetto);
				notizie.push(oggetto);
				console.log("Scrivo sulla socket");
				// Scrivo su socket le notizie
				socket.send(data);
				// Levo la prima pagina
				pagine.shift();
				// Passo a quella successiva
				riceviNotizie(notizie, pagine, socket);
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
