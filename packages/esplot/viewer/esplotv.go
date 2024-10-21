package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
	"regexp"

	"github.com/gorilla/websocket"
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

var upgrader = websocket.Upgrader{}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("gorilla/websocket: Upgrader.Upgrade: %s", err)
		return
	}
	defer c.Close()

	err = c.WriteMessage(websocket.TextMessage, []byte("hei"))
	if err != nil {
		log.Println("write:", err)
	}
}

func main() {
	window := webview.New(true)
	if window == nil {
		log.Fatalln("Failed to load webview.")
	}
	defer window.Destroy()

	fs := http.FileServer(http.FS(content))
	http.Handle("/", AppendPrefix("/wwwroot", fs))
	http.HandleFunc("/websocket", websocketHandler)
	http.Handle("/new", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		window.Eval("alert('hei')")
		fmt.Println("Whathathahtahth")


	}))

	go http.ListenAndServe(":46852", nil)

	window.SetTitle("esplot-viewer")
	window.SetSize(800, 600, webview.HintNone)

	window.Navigate("http://localhost:46852/index.html")

	//window.Init("setInterval(() => fetch('./new').then(res => console.log(res)), 1000)")

	window.Run()

	//if len(os.Args) < 2 {
	//	log.Fatalln("Provide a path to a .html file as the first argument.")
	//}

	//dir, err := os.Getwd()
	//if err != nil {
	//	panic(err)
	//}

	//path := os.Args[1]
	//isAbs := filepath.IsAbs(path)
	//pathToFile := path
	//if !isAbs {
	//	pathToFile = filepath.Join(dir, path)
	//}

	//data, err := os.ReadFile(pathToFile)
	//if err != nil {
	//	panic(err)
	//}

	//w := webview.New(true)
	//if w == nil {
	//	log.Fatalln("Failed to load webview.")
	//}
	//defer w.Destroy()

	//w.SetTitle("esplot-viewer")
	//w.SetSize(800, 600, webview.HintNone)

	//w.SetHtml(string(data))

	//fmt.Println("esplot-viewer started");

	//w.Run()
}
