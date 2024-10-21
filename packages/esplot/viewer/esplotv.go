package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	webview "github.com/webview/webview_go"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatalln("Provide a path to a .html file as the first argument.")
	}

	dir, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	path := os.Args[1]
	isAbs := filepath.IsAbs(path)
	pathToFile := path
	if !isAbs {
		pathToFile = filepath.Join(dir, path)
	}

	data, err := os.ReadFile(pathToFile)
	if err != nil {
		panic(err)
	}

	w := webview.New(true)
	if w == nil {
		log.Fatalln("Failed to load webview.")
	}
	defer w.Destroy()

	w.SetTitle("esplot-viewer")
	w.SetSize(800, 600, webview.HintNone)

	w.SetHtml(string(data))

	fmt.Println("esplot-viewer started");

	w.Run()
}
