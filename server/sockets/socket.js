const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client)=> {

    client.on('entrarChat', (data, callback) => {
        // console.log(data.nombre);
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'  
            });
        }
        // console.log(data.sala);
        // metodo join() sirve para unir al usuario a una sala
        client.join(data.sala)

        usuarios.agregaPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listarPersona', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió`));
        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        
        callback(mensaje);

    });

    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id);
        console.log(personaBorrada)
        client.broadcast.to(personaBorrada.sala).emit( 'crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salio`))
        client.broadcast.to(personaBorrada.sala).emit( 'listarPersona', usuarios.getPersonasPorSala(personaBorrada.sala))
    });

   
    // Mensaje privado
    // Metodo to() nos permite enviar un mensaje privado, ingresandole un ID
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    })
    
});