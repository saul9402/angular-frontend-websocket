import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  escribiendo: string;
  clienteId: string;


  constructor() {
    this.clienteId = 'id-' + new Date().getUTCMilliseconds() + '-' + Math.random().toString(36).substr(2);
  }

  ngOnInit() {
    //Este será el objeto que se utilizará para relizar los subscribe y mandar peticiones al broker
    this.client = new Client();
    // se asigna SockJs al stomp
    this.client.webSocketFactory = () => {
      //aqui se asigna el endpoint que se configuró en spring
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    //aqui indicas cualquier atrea cuando alguien se conecta
    this.client.onConnect = (frame) => {
      //el objeto frame contiene toda la información de la conexión con el broker
      console.log("Conectados: " + this.client.connected + " : " + frame);
      this.conectado = true;

      /* Con esto te subscribes a los eventos del broker; 
        el primer parametro es el nombre del evento a escuchar,
        el segundo es una funcion que permite manejar cuando llega
        un nuevo mensaje al broker.
      */
      this.client.subscribe('/chat/mensaje', e => {
        /*este es el mensaje que alguien escribió, que llegó al broker
        que el broker emitió a los subscritores y que llegó por ese medio
        hasta este método.
        */
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);
        if (!this.mensaje.color
          && mensaje.tipo == 'NUEVO_USUARIO'
          && this.mensaje.username == mensaje.username) {
          this.mensaje.color = mensaje.color;
        }
        this.mensajes.push(mensaje);
        console.log(mensaje);
      });
      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({
        destination: "/app/mensaje",
        body: JSON.stringify(this.mensaje)
      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => {
          this.escribiendo = '';
        }, 2000);
      });
      console.log(this.clienteId);
      this.client.subscribe('/chat/historial/' + this.clienteId, e => {
        const historial = JSON.parse(e.body) as Mensaje[];
        this.mensajes = historial.map(m => {
          m.fecha = new Date(m.fecha);
          return m;
        }).reverse()
      });

      this.client.publish({ destination: '/app/historial', body: this.clienteId });

    }

    this.client.onDisconnect = (frame) => {
      console.log("Desonectados: " + !this.client.connected + " : " + frame);
      this.conectado = false;
      this.mensaje = new Mensaje();
      this.mensajes = [];
    }
  }




  conectar(): void {
    // se usa el metodo activate para conectarse
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    /*con este metodo publicas un evento en el broker
    como primer argumento se envia un objeto que llevará el destino
    */
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({
      destination: "/app/mensaje",
      body: JSON.stringify(this.mensaje)
    });
    this.mensaje.texto = '';
  }

  escribiendoEvento() {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({
      destination: "/app/escribiendo",
      body: this.mensaje.username
    });
  }


}
