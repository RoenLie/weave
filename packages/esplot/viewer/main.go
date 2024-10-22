package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"

	webview "github.com/webview/webview_go"
)

//go:embed wwwroot/*
var content embed.FS

func AppendPrefix(prefix string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		trimDuplicates := func(str string, duplicate string) string {
			regex := regexp.MustCompile("(?:" + duplicate + "){2,}")

			return regex.ReplaceAllString(str, duplicate)
		}

		// Get the original URL.
		url := r.URL

		// Mutate the URL.
		url.Path = trimDuplicates(prefix+url.Path, "/")

		fmt.Println(url.Path)

		h.ServeHTTP(w, r)
	})
}


func main() {
	window := webview.New(true)
	if window == nil {
		log.Fatalln("Failed to load webview.")
	}
	defer window.Destroy()

	hub := newHub()
	go hub.run()

	http.Handle("/", AppendPrefix("/wwwroot", http.FileServer(http.FS(content))))
	http.Handle("/new", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			return
		}

		html, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("Error reading response body:", err)
			return
		}

		hub.broadcast <- html
	}))

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	go http.ListenAndServe(":46852", nil)

	window.SetTitle("esplot-viewer")
	window.SetSize(800, 600, webview.HintNone)

	window.Navigate("http://localhost:46852/index.html")

	window.Run()
}
