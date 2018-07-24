Progetto Reti di Calcolatori - Raccolta Notizie

L'applicazione accede al servizio REST di Facebook tramite OAuth
per ottenere i giochi a cui l'utente ha messo mi piace. Per ogni gioco 
ottenuto viene effettuata una ricerca tramite il servizio REST di newsapi.org
per accedere alle cinque ultime notizie pubblicate da una testata giornalistica 
specializzata in notizie di videogiochi chiamata IGN. Le notizie vengono notificate al client
,in questo caso il browser, attraverso i WebSocket. L'applicazione comunica 
con un'altra applicazione tramite AMQP per effettuare logging su file.

Per eseguire:
node app.js
node logfile.js

Documentazione API

OAuth FB:
Quando un utente accede all'applicazione, viene ridirezionato sulla pagina di login di facebook
per consentire l'accesso da parte dell'applicazione ai dati relativi ai mi piace dell'utente connesso.

https://www.facebook.com/v3.0/dialog/oauth?
  client_id={app-id}
  &redirect_uri={redirect-uri}
  &state={state-param}

  client_id è il codice univoco dell'applicazione data da Facebook
  redirect_uri è il sito a cui viene ridirezionato l'utente dopo aver accettato o rifiutato l'accesso
  state è un valore di tipo stringa creato dalla tua app per mantenere il parametro state tra la richiesta e la callback.
  
Ora l'applicazione verifica che l'utente abbia effettuato l'accesso e scambia il codice ricevuto con il redirect
(code) per un token d'accesso per confermare confermare che l'utente che la sta usando è lo stesso a cui sono destinati i dati della risposta.
Si ottiene attraverso una richiesta GET all'endpoint OAuth:

https://graph.facebook.com/v3.0/oauth/access_token?
	client_id={app-id}
	&redirect_uri={redirect-uri}
	&client_secret={app-secret}
	&code={code-parameter}
	
	client_id è il codice univoco dell'applicazione data da Facebook
	redirect-uri è il sito a cui viene ridereionato l'utente dopo aver accettato o rifiutato l'accesso ( lo stesso )
	client_secret è una chiave segreta dell'applicazione data da Facebook
	code è il codice restituito dall'endpoint precedente
	
La risposta è in formato JSON e contiene il risultato dell'azione e, in caso di successo, il token di accesso alle API
Graph di facebook per accedere alle informazioni dell'utente connesso.
Il token di accesso viene memorizzato lato server nella sessione del browser.


Graph API Facebook:

Con l'applicazione ottengo solo i mi piace relativi alle pagine di giochi dell'utente.
Ne ottengo 5, tramite richiesta get al nodo 'me' che identifica l'utente connesso.

https://graph.facebook.com/me/?fields=games.limit(5)&access_token=ACCESS_TOKEN
	
	fields=games, ottengo i giochi che piacciono all'utente
	.limit(5), ne voglio ottenere solo 5
	access_token, è il token di accesso ottenuto precedentemente tramite OAuth.
	
La risposta è in formato JSON contenente il nome della pagina, l'identificativo della pagina e la data in cui è stato
messo il mi piace.

NewsAPI.org:
Per l'accesso ai nodi dell'API per ottenere le notizie relative ai giochi è necessario richiedere una API-Key tramite 
registrazione sul sito.
Con la chiave API è possibile richiedere informazioni ai nodi del servizio REST tramite richieste GET.

https://newsapi.org/v2/everything?q="nomegioco"&sortBy=publishedAt&sources=ign&language=en&pageSize=5&apiKey=CHIAVEAPI

	q="nomegioco", il nome del gioco da ricercare nelle notizie, tra virgolette affinché siano presente esattamente le parole cercate insieme negli articoli
	sortBy=publishedAt, le notizie in ordine di ultima uscita
	sources=ign, solo dalla testata giornalistica IGN
	language=en, solo articoli in lingua inglese
	pageSize=5, voglio solo 5 articoli
	apiKey=CHIAVE, obbligatoria la chiave per l'accesso ai nodi REST
