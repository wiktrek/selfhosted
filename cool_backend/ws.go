package main

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		fmt.Println(r.Host)
		if r.Host != "https://wiktrek.xyz" {
			return false
		}
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan []byte)
var mutex = &sync.Mutex{}
var coolDown = make(map[*websocket.Conn]bool)

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}
	defer conn.Close()

	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			break
		}
		if !coolDown[conn] {
			broadcast <- message
			coolDown[conn] = true
			go func() {
				time.Sleep(750 * time.Millisecond)
				coolDown[conn] = false
			}()
		}
	}
}

func handleMessages() {
	for {
		message := <-broadcast

		mutex.Lock()
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}
