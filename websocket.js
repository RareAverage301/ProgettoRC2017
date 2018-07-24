$(document).ready(function(){
	//var indirizzoServer = "192.168.1.219";
	//var indirizzoServer = "87.3.184.135";
	var indirizzoServer = "localhost";
	var socket = new WebSocket("ws://"+indirizzoServer+":4000");
	//var indice = 0;
	var numeroGiochi;
	var numeroMessaggioRicevuto = 0;
	// Funzione chiamata quando si connette al websocket server
	socket.onopen = function(event){
		console.log("Connesso al server");
		socket.send("Ciaone");
	};

	// Funzione chiamata quando ricevo un messaggio nella websocket
	socket.onmessage = function(event){
		console.log("Ricevuto il messaggio numero: "+ numeroMessaggioRicevuto);
		if ( numeroMessaggioRicevuto == 0 )
		{
			numeroGiochi = event.data;
			console.log("Settato il numero di giochi");
			if ( numeroGiochi == 0 )
			{
				$('.container').append('<div class="row"><div class="col"><i>Nessun gioco disponibile</i></div></div>');
			}
		}
		else
		{
			// Ottengo il JSON delle notizie del gioco
			var notizieGioco = JSON.parse(event.data);
			console.log(event.data);
			// Inserisco nel DOM il nome del gioco
			$('.container').append('<div class="row"><div class="col" style="font-weight: bold; font-size: large; text-align: center">'+notizieGioco.gioco+'</div></div>');
			$('.container').append('<div class="row" id="gioco'+numeroMessaggioRicevuto+'">');
			var indice = 0;
			// Se ci sono delle notizie
			if ( notizieGioco.articles.length > 0 )
			{
				$('#gioco'+numeroMessaggioRicevuto).append('<div class="col-1"></div>');
				while ( indice < notizieGioco.articles.length )
				{
					// Inserisco nel DOM le notizie del gioco
					$('#gioco'+numeroMessaggioRicevuto).append('<div class="col-2"> <img src="'+notizieGioco.articles[indice].urlToImage+'" class="img-thumbnail"><a href="'+notizieGioco.articles[indice].url+'">'+notizieGioco.articles[indice].title+'</a></div>');
					indice = indice + 1;
				}
				$('#gioco'+numeroMessaggioRicevuto).append('<div class="col-1"></div>');
			}
			else
			{
				$('#gioco'+numeroMessaggioRicevuto).append('<div class="col" style="text-align: center" ><i>Nessuna notizia disponibile per questo gioco</i></div>');
			}
			$('.container').append('</div>');
			if ( numeroMessaggioRicevuto > numeroGiochi )
			{
				// Chiudo la socket
				socket.close();
			}
			socket.onclose = function(event){
				console.log("chiusura socket");
			};
		}		
		numeroMessaggioRicevuto = numeroMessaggioRicevuto + 1;
	};
	window.onbeforeunload = function () {
		socket.close();
	}
});