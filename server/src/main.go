package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

func serveFile(w http.ResponseWriter, r *http.Request, f *os.File) {
	fileInfo, err := f.Stat()
	if err != nil {
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, fileInfo.Name(), fileInfo.ModTime(), f)
}

func getPublicFile(w http.ResponseWriter, r *http.Request) {
	filepath := r.URL.Path
	if filepath == "/" {
		filepath = "index.html"
	}
	file, err := os.Open("./public" + filepath)
	if err != nil {
		indexFile, indexerr := os.Open("./public/index.html")
		if indexerr != nil {
			fmt.Printf("Catastrophic Error: Could not get base index fallback: %s\n", indexerr)
			http.Error(w, "Error reading file", http.StatusInternalServerError)
			os.Exit(1)
		}
		defer indexFile.Close()
		serveFile(w, r, indexFile)
		return
	}
	defer file.Close()
	serveFile(w, r, file)
}

func getHello(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /hello request\n")
	io.WriteString(w, "Hello, HTTP!\n")
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/hello", getHello)

	mux.HandleFunc("/", getPublicFile)
	mux.HandleFunc("*", getPublicFile)

	err := http.ListenAndServe(":3333", mux)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
