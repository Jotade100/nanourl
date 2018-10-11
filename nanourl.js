'use strict';
// Constantes de trabajo
const express = require('express')
const bodyParser = require('body-parser');
const mysql = require('mysql');
var url = require('url');
const querystring = require('querystring'); 
const clipboardy = require('clipboardy'); 
var jade = require('jade');
var ncp = require("copy-paste");
const copy = require('clipboard-copy')
// Variables para construir la URL de consultas  
// Originalmente se sirve de dos atributos pero por cuestiones de Google Cloud Platform
//var puerto = 4000;
//var direccionGeneral = 'http://localhost:';
var puerto = '';
var direccionGeneral = "https://nanourl-219102.appspot.com"
var navigator = {
    userAgent: 'node.js'
};


//// ------------------------------------------------------------------------------------


// Función usada para producir un número aleatorio entre x & y
// Obtenida de https://www.w3schools.com/js/js_random.asp
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Mi función para obtener una cadena aleatoria 
// La lógica es usar un número aleatorio entre una cadena de caracteres permitidos
function cadenaAleatoria(largo, arreglo) {
    var resultado = "";
    for (var i = largo; i > 0; i--) {
	resultado += arreglo[getRndInteger(0, arreglo.length)];
	}
    return resultado;
}

// Probando la función
var caracteresParaGenerar = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var ejemplo = cadenaAleatoria(8, caracteresParaGenerar);
console.log(ejemplo)

//// --------------------------------------------------------------------------------------

var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","jade")
var conexion = mysql.createConnection({
  host: "sql2.freemysqlhosting.net",
  user: "sql2260459",
  password: "mT2!rJ9%",
  database: "sql2260459"
});


// GET todas las url
app.get("/todas", function (req, res, error){
	conexion.query("SELECT * FROM direccion ORDER BY contador DESC LIMIT 10", function (err, result) {
		if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
		console.log("Resultado: " + JSON.stringify(result));
		var resultado = result;
		res.render('todas', { title: "Top 10 most visted NanoURL's", lista: resultado });
	});
})

// GET todos los OS
app.get("/todos", function (req, res, error){
	conexion.query("SELECT sistema, SUM(contador) AS contador FROM sistemaoperativo GROUP BY sistema ORDER BY contador DESC", function (err, result) {
		if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
		console.log("Resultado: " + JSON.stringify(result));
		var resultado = result;
		res.render('todas', { title: "Stats by OS", lista: resultado });
	});
})

app.get("/:codigo", function (req, res, error){
	var codigo = req.params.codigo;
	console.log("^^")
	console.log(codigo)
	conexion.query("SELECT * FROM direccion WHERE codigo LIKE '"+codigo+"'", function (err, result) {
		if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
			if(result.length) {
				var sql = "UPDATE direccion SET contador = (contador +1) WHERE codigo LIKE '"+codigo+"'"
				conexion.query(sql, function (err, result) {
				if (err) throw res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});});
				console.log("Resultado: " + result[0].id);
				var resultado = result[0];
				var url = resultado.id;
				var sistema;
				var encabezado = req.headers['user-agent'].toLowerCase();
				if (encabezado.indexOf("windows") >= 0 ) {
					sistema = "Windows";
				} else if(encabezado.indexOf("mac") >= 0) {
					sistema = "Mac";
				} else if(userAgent.toLowerCase().indexOf("x11") >= 0) {
					sistema = "Unix";
				} else if(userAgent.toLowerCase().indexOf("android") >= 0) {
					sistema = "Android";
				} else if(userAgent.toLowerCase().indexOf("iphone") >= 0) {
					sistema = "IPhone";
				} else {
					sistema = "El hijo de la llorona...";
				}
				
				conexion.query("INSERT IGNORE INTO sistemaoperativo (id, sistema) VALUES( '"+url +"', '"+sistema+"')", function (error, result, fields) {
					if (error) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
					// Luego de verificar crea el registro en la base de datos		
					var sql = "UPDATE sistemaoperativo SET contador = (contador +1) WHERE id LIKE '"+url+"'";
					conexion.query(sql, function (err, result) {
						if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
						console.log("Resultado: " + sistema);
					});
					
				});
				//console.log("Resultado: " + JSON.stringify(resultado));
				res.redirect(resultado.id);
			} else {
				res.render('newurl', { title: 'Make NANO your URL', mensaje: 'NO HAY URL ASOCIADA'});
			}
	});
})


// GET crear una url
app.get('/newurl/:codigo', function(req, res) {
    var codigo = req.params.codigo;
	console.log("^^")
	console.log(codigo)
	conexion.query("SELECT * FROM direccion WHERE codigo LIKE '"+codigo+"'", function (err, result) {
		if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
			if(result.length) {
				console.log("Resultado: " + result[0].id);
				var resultado = result[0];
				//console.log("Resultado: " + JSON.stringify(resultado));
				res.render('newurl', { title: 'Make NANO your URL', mensaje: 'Su código de URL es: '+direccionGeneral+puerto+'/'+resultado.codigo });
				// Originalmente con clipboardy pero no es tolerado en los servidores de Google
				//clipboardy.writeSync(direccionGeneral+'/'+resultado.codigo);
				//copy(direccionGeneral+'/'+resultado.codigo);
				//navigator.clipboard.writeText(direccionGeneral+'/'+resultado.codigo);
				ncp.copy(direccionGeneral+'/'+resultado.codigo, function () {
				// complete...
					console.log(direccionGeneral+'/'+resultado.codigo+' HA SIDO COPIADO');
				})
			} else {
				res.render('newurl', { title: 'Make NANO your URL', mensaje: ''});
			}
	});
});



// POST sencillo


app.post("/createurl", function(req, res) {
    var url = req.body.url;
	var devolucion = cadenaAleatoria(6, caracteresParaGenerar);
	// Verifica si ya existe la URL
	var resultado = [];
	conexion.query("INSERT IGNORE INTO direccion (id, codigo) VALUES( '"+url +"', '"+devolucion+"')", function (error, result, fields) {
		if (error) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});;
		// Luego de verificar crea el registro en la base de datos
		
		var sql = "SELECT * FROM direccion WHERE ID LIKE '"+url+"'";
		console.log(sql);
		conexion.query(sql, function (err, result) {
			if (err) res.render('newurl', { title: 'Make NANO your URL', mensaje: '¡HUBO UN ERROR!'});
				console.log("Resultado: " + result[0].id);
				resultado = result[0];
				res.redirect("/newurl/" + resultado.codigo);
		});
		
	});
	
});

app.get("/", function(req, res) {
    res.render('newurl', { title: 'Make NANO your URL', mensaje: ''});
});

app.get("/about/me", function(req, res) {
    res.render('about', { });
});

app.delete("/delete", function(req, res) {
    var url = req.body.url;
	conexion.query("DELETE FROM direccion WHERE id LIKE '"+url +"'", function (error, result, fields) {
		if (error) console.log("Hubo un error");
		// Luego de eliminar
		console.log("Eliminado");
		res.send("Eliminado");
		
		
	});
});

app.delete("/deletecode", function(req, res) {
    var url = req.body.url;
	conexion.query("DELETE FROM direccion WHERE codigo LIKE '"+url +"'", function (error, result, fields) {
		if (error) console.log("Hubo un error");
		// Luego de eliminar
		console.log("Eliminado");
		res.send("Eliminado");
		
		
	});
});

//app.listen(8080, function (){
//	console.log("¡HOLA! desde puerto: " + 8080);	
//})

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  conexion.connect(function(err) {
		if (err) throw err;
		console.log("¡Conexión a Base de Datos lograda exitosamente!!");
	});
  // [END server]
}

module.exports = app;





