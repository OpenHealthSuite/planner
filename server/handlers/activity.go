package handlers

import (
	"encoding/json"
	"net/http"
	"planner/middlewares"
	"planner/storage"
)

func generateCreateActivityHandler(strg storage.ActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var activity storage.Activity
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		err := decoder.Decode(&activity)
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
