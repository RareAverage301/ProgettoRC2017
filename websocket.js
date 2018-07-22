var socket = new WebSocket("ws://localhost:4000");

// Funzione chiamata quando si connette al websocket server
socket.onopen = function(event){
	console.log("Connesso al server");
};

// Funzione chiamata quando ricevo un messaggio nella websocket
socket.onmessage = function(event){
	console.log(event.data);
};

//socket.close();
