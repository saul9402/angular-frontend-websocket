import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;
  conectado: boolean = false;


  constructor() { }

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
    }

    this.client.onDisconnect = (frame) => {
      console.log("Desonectados: " + !this.client.connected + " : " + frame);
      this.conectado = false;
    }
  }




  conectar(): void {
    // se usa el metodo activate para conectarse
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();

  }

}
