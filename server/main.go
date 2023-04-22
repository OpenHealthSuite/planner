package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"planner/handlers"
	"planner/middlewares"
	"planner/storage"
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
	io.WriteString(w, "Hello, HTTP!\n")
}

type UserInfo struct {
	UserId string `json:"userId"`
}

func getUserInfo(w http.ResponseWriter, r *http.Request) {
	userInfo := UserInfo{
		UserId: w.Header().Get(middlewares.VALIDATED_HEADER),
	}

	jsonData, err := json.Marshal(userInfo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func main() {
	mux := http.NewServeMux()

	useridHeader := os.Getenv("PLANNER_USERID_HEADER")

	if useridHeader == "" {
		useridHeader = "x-planner-userid"
	}

	storageType := storage.Sqlite
	storageTypeSetting := os.Getenv("PLANNER_STORAGE_TYPE")
	if storageTypeSetting == string(storage.Cassandra) {
		storageType = storage.Cassandra
	}

	useridMiddleware := middlewares.RequiresUserIdHeader(useridHeader)
	storage, err := storage.GetStorage(storageType)

	if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}

	mux.HandleFunc("/api/hello", getHello)

	mux.Handle("/api/whoami", useridMiddleware(http.HandlerFunc(getUserInfo)))

	handlers.AddActivityHandlers(mux, storage.Activity, storage.Plan, useridMiddleware)
	handlers.AddPlanHandlers(mux, storage.Plan, storage.Activity, useridMiddleware)

	mux.HandleFunc("/", getPublicFile)
	mux.HandleFunc("*", getPublicFile)

	err = http.ListenAndServe(":3333", mux)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
