var amqp = require('amqplib/callback_api');
var fs = require('fs');

amqp.connect('amqp://localhost', function(err, conn){
	console.log(err);
	conn.createChannel(function(err, ch){

		//var exchange = 'logger';
		// Assicura che esista l'exchange
		ch.assertExchange('logger', 'direct', {durable: true});
		// Assicura che esista la coda
		ch.assertQueue('codaLog', {durable: true}, function(err, coda){
			console.log(err);
			console.log(coda);
			ch.bindQueue(coda.queue, 'logger', 'prova');
			// Consumo(leggo) il messaggio dalla coda
			ch.consume('codaLog', function(msg){
				var stringa = ottieniTimestamp()+" | Ricevuto: "+msg.content.toString();
				console.log(ottieniTimestamp()+" | "+msg.content.toString());
				fs.appendFile("fileLog.txt", stringa+"\n", function(errore){
					if ( errore ) throw errore;
					console.log("Scrittura avvenuta con successo su file");
				});
			}, {noAck: true});
		});
	});
});


function ottieniTimestamp()
{
	data = new Date();
	return ((data.getDate()) + '/' + (data.getMonth() + 1) + '/' + data.getFullYear() + " " + data.getHours() + ':'
                     + ((data.getMinutes() < 10) ? ("0" + data.getMinutes()) : (data.getMinutes())) + ':' + ((data.getSeconds() < 10) ? ("0" + data.getSeconds()) : (data.getSeconds())));
}