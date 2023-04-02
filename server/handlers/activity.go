package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"planner/middlewares"
	"planner/storage"

	"github.com/google/uuid"
)

func AddActivityHandlers(mux *http.ServeMux, strg storage.ActivityStorage, useridMiddleware middlewares.Middleware) {
	mux.Handle("/api/activities", useridMiddleware(registerRoot(strg)))
	mux.Handle("/api/activities/{activityId}", useridMiddleware(registerId(strg)))
}

func registerRoot(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleCreateActivity(w, r, strg)
		} else if r.Method == http.MethodGet {
			handleUserQueryActivity(w, r, strg)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}
}

func registerId(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			handleUpdateActivity(w, r, strg)
		} else if r.Method == http.MethodGet {
			handleReadActivity(w, r, strg)
		} else if r.Method == http.MethodDelete {
			handleDeleteActivity(w, r, strg)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}

}

func parseActivity(rdr io.Reader) (storage.Activity, error) {
	var activity storage.Activity
	decoder := json.NewDecoder(rdr)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(&activity)
	return activity, err
}

func handleCreateActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	activity, err := parseActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activity.UserId = r.Header.Get(middlewares.VALIDATED_HEADER)

	created, err := strg.Create(activity)
	jsonData, err := json.Marshal(created.Id.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func handleReadActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	uuid, err := uuid.Parse(r.URL.Query().Get("activityId"))

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := r.Header.Get(middlewares.VALIDATED_HEADER)

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	jsonData, err := json.Marshal(storedActivity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

// TODO: Skipping tests until query gets more complex
func handleUserQueryActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	userId := r.Header.Get(middlewares.VALIDATED_HEADER)

	queried, err := strg.Query(storage.ActivityStorageQuery{UserId: &userId})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonData, err := json.Marshal(queried)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)

}

func handleUpdateActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	activity, err := parseActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	uuid, err := uuid.Parse(r.URL.Query().Get("activityId"))

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := r.Header.Get(middlewares.VALIDATED_HEADER)

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	activity.Id = uuid
	activity.UserId = userId

	updateErr := strg.Update(activity)
	if updateErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))

}

func handleDeleteActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	uuid, err := uuid.Parse(r.URL.Query().Get("activityId"))

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := r.Header.Get(middlewares.VALIDATED_HEADER)

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	deleteErr := strg.Delete(uuid)
	if deleteErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))
}
