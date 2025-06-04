// src/app/Core/services/websocket.service.ts

import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription, StompConfig } from '@stomp/stompjs'; // Import StompSubscription et StompConfig
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import * as SockJS from 'sockjs-client';

// Énumération pour représenter l'état de la connexion
export enum SocketClientState {
  INIT,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  FAILED
}

@Injectable({
  providedIn: 'root' // Service disponible globalement
})
export class WebsocketService implements OnDestroy { // Implémente OnDestroy pour nettoyage
  private client: Client;
  private state = new BehaviorSubject<SocketClientState>(SocketClientState.INIT);
  // Garde une trace des abonnements actifs par leur ID STOMP
  private activeSubscriptions: Map<string, StompSubscription> = new Map();

  // *** ADAPTEZ CETTE URL à votre endpoint Spring Boot WebSocket ***
  private serverUrl = 'http://localhost:8087/ws-courses'; // Ex: 'ws://localhost:8087/ws' si différent
  // **************************************************************

  constructor() {
    const stompConfig: StompConfig = {
      webSocketFactory: () => new SockJS(this.serverUrl), // Utilise SockJS
      debug: (str) => { console.log('STOMP DEBUG: ' + str); },
      reconnectDelay: 5000, // Tente de reconnecter après 5s
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    };

    this.client = new Client(stompConfig);

    // --- Gestionnaires d'événements STOMP ---
    this.client.onConnect = (frame) => {
      console.log('STOMP: Connected successfully!', frame);
      this.state.next(SocketClientState.CONNECTED);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP: Broker reported error: ' + frame.headers['message']);
      console.error('STOMP: Additional details: ' + frame.body);
      this.state.next(SocketClientState.FAILED);
    };

    this.client.onDisconnect = () => {
        console.log('STOMP: Disconnected.');
        this.state.next(SocketClientState.DISCONNECTED);
        this.activeSubscriptions.clear();
    };

    this.client.onWebSocketError = (error) => {
        console.error('WebSocket Error:', error);
        this.state.next(SocketClientState.FAILED);
    };

     this.client.onWebSocketClose = (event) => {
         console.log('WebSocket Closed:', event);
         if(this.state.getValue() !== SocketClientState.DISCONNECTED){
            this.state.next(SocketClientState.DISCONNECTED);
            this.activeSubscriptions.clear();
         }
     };
  }

  // Observable pour suivre l'état de la connexion
  public getState(): Observable<SocketClientState> {
    return this.state.asObservable();
  }

  // Initier la connexion
  connect(): void {
    if (this.state.getValue() === SocketClientState.CONNECTED || this.state.getValue() === SocketClientState.CONNECTING) {
      console.warn("WebSocket already connected or connecting.");
      return;
    }
    this.state.next(SocketClientState.CONNECTING);
    console.log("Activating STOMP client...");
    this.client.activate();
  }

  // Se déconnecter proprement
  disconnect(): void {
    console.log("Deactivating STOMP client...");
    // Utiliser les IDs stockés pour se désabonner
    this.activeSubscriptions.forEach((sub, subId) => {
        console.log(`Unsubscribing internal ID ${subId}`);
        try { sub.unsubscribe(); } catch(e) { console.error(`Error unsubscribing ${subId}`, e); }
    });
    this.activeSubscriptions.clear();

    if (this.client.active) {
        this.client.deactivate();
    } else {
        console.log("STOMP client already inactive.");
    }
     // L'état DISCONNECTED est normalement émis par onDisconnect/onWebSocketClose
     // Mais on peut le forcer si l'état n'est pas déjà DISCONNECTED
     if (this.state.getValue() !== SocketClientState.DISCONNECTED) {
         this.state.next(SocketClientState.DISCONNECTED);
     }
  }

  // S'abonner à un topic et retourner l'objet Subscription
  subscribeAndGetSubscription(topic: string, callback: (message: IMessage) => void): StompSubscription | null {
    if (this.state.getValue() !== SocketClientState.CONNECTED) {
        console.warn(`Cannot subscribe to ${topic}. WebSocket not connected yet. Will attempt after connection.`);
        // Attendre la connexion puis tenter de s'abonner
        this.getState().pipe(
          filter(state => state === SocketClientState.CONNECTED),
          first() // Prendre seulement le premier état CONNECTED
        ).subscribe(() => {
            console.log(`Retrying subscription to ${topic} now that client is connected.`);
            // Note: cette approche récursive simple peut poser problème si la connexion échoue à nouveau.
            // Une approche plus robuste utiliserait une file d'attente ou gérerait mieux les tentatives multiples.
            // Pour l'instant, on suppose que le composant appelant gérera la logique de rappel si nécessaire.
             // Appel récursif N'EST PAS idéal ici. Le composant doit gérer l'abonnement après connexion.
             // ON RETOURNE NULL pour indiquer que l'abonnement n'est pas immédiat.
        });
        return null;
    }

    console.log(`Subscribing to ${topic}`);
    try {
        const subscription = this.client.subscribe(topic, callback, { id: `sub-${topic}-${Date.now()}` }); // Donne un ID plus prédictible (optionnel)
        // Enregistrer l'abonnement en utilisant l'ID fourni ou généré
        const subId = subscription.id;
        this.activeSubscriptions.set(subId, subscription);
        console.log(`Subscription successful for ${topic} with internal ID: ${subId}`);
        return subscription;
    } catch (e) {
        console.error(`Failed to subscribe to topic ${topic}`, e);
        return null;
    }
  }

  // Se désabonner en utilisant l'objet Subscription
  unsubscribeSubscription(subscription: StompSubscription | null): void {
    if (subscription) {
        const subId = subscription.id; // Récupérer l'ID de l'objet subscription
        if (this.activeSubscriptions.has(subId)) {
             console.log(`Unsubscribing from subscription ID ${subId}`);
             try { subscription.unsubscribe(); } catch(e) { console.error(`Error unsubscribing ${subId}`, e); }
             this.activeSubscriptions.delete(subId);
        } else {
            console.warn(`Attempted to unsubscribe unknown or already removed subscription ID ${subId}`);
            // Essayer quand même de désabonner l'objet fourni
            try { subscription.unsubscribe(); } catch (e) {/* Ignore */}
        }
    } else {
         console.warn("Attempted to unsubscribe a null subscription.");
    }
  }

  // Envoyer un message
  send(destination: string, body?: any): void {
    if (this.state.getValue() !== SocketClientState.CONNECTED) {
      console.error(`Cannot send message to ${destination}. WebSocket not connected.`);
      // Optionnel : Mettre en file d'attente pour envoyer après connexion ? (Plus complexe)
      return;
    }
    try {
        const bodyString = body ? JSON.stringify(body) : '';
        console.log(`Sending message to ${destination} with body: ${bodyString}`);
        this.client.publish({ destination: destination, body: bodyString });
    } catch (e) {
        console.error(`Failed to send message to ${destination}`, e);
    }
  }

  // Nettoyage lors de la destruction du service (par Angular)
  ngOnDestroy(): void {
    console.log("WebsocketService ngOnDestroy called. Disconnecting.");
    this.disconnect();
  }
}