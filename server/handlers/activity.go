package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"planner/middlewares"
	"planner/storage"

	"github.com/google/uuid"
)

func parseActivity(rdr io.Reader) (storage.Activity, error) {
	var activity storage.Activity
	decoder := json.NewDecoder(rdr)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(&activity)
	return activity, err
}

func generateCreateActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}

func generateReadActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}

// TODO: Skipping tests until query gets more complex
func generateUserQueryActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}

func generateUpdateActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}

func generateDeleteActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}
