package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"planner/middlewares"
	"planner/storage"
	"strings"
	"time"

	"github.com/google/uuid"
)

func AddActivityHandlers(mux *http.ServeMux, strg storage.ActivityStorage, plnStrg storage.PlanStorage, useridMiddleware middlewares.Middleware) {
	mux.Handle("/api/activities", useridMiddleware(registerActivityRoot(strg, plnStrg)))
	mux.Handle("/api/activities/", useridMiddleware(registerActivityId(strg, plnStrg)))
}

func registerActivityRoot(strg storage.ActivityStorage, plnStrg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleCreateActivity(w, r, strg, plnStrg)
		} else if r.Method == http.MethodGet {
			handleUserQueryActivity(w, r, strg)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}
}

func registerActivityId(strg storage.ActivityStorage, plnStrg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(r.URL.Path, "/")
		id := parts[3]

		uuid, err := uuid.Parse(id)

		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if r.Method == http.MethodPut {
			handleUpdateActivity(w, r, strg, plnStrg, uuid)
		} else if r.Method == http.MethodGet {
			handleReadActivity(w, r, strg, uuid)
		} else if r.Method == http.MethodDelete {
			handleDeleteActivity(w, r, strg, uuid)
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

func handleCreateActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage, plnStrg storage.PlanStorage) {
	activity, err := parseActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activity.UserId = w.Header().Get(middlewares.VALIDATED_HEADER)

	if activity.PlanId != nil && !validPlanId(plnStrg, activity) {
		http.Error(w, "Plan not found", http.StatusBadRequest)
		return
	}

	created, err := strg.Create(activity)
	jsonData, err := json.Marshal(created.Id.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func validPlanId(plnStrg storage.PlanStorage, activity storage.Activity) bool {
	plan, err := plnStrg.Read(*activity.PlanId)
	if plan == nil || plan.UserId != activity.UserId || err != nil {
		return false
	}
	return true
}

func handleReadActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage, uuid uuid.UUID) {
	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

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

func handleUserQueryActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage) {
	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	rawPlanId := r.URL.Query().Get("planId")
	var planid *uuid.UUID
	parsedPlanId, err := uuid.Parse(rawPlanId)
	if rawPlanId != "" && err != nil {
		http.Error(w, "Bad Plan Id", http.StatusBadRequest)
		return
	}
	if rawPlanId != "" {
		planid = &parsedPlanId
	}

	rawStartTime := r.URL.Query().Get("timeStart")
	rawEndTime := r.URL.Query().Get("timeEnd")

	var timeRange *storage.DateRange
	startTime, startErr := time.Parse(time.RFC3339, rawStartTime)
	endTime, endErr := time.Parse(time.RFC3339, rawEndTime)
	if rawStartTime != "" && rawEndTime != "" && startErr == nil && endErr == nil {
		timeRange = &storage.DateRange{
			Start: startTime,
			End:   endTime,
		}
	}

	queried, err := strg.Query(storage.ActivityStorageQuery{UserId: &userId, PlanId: planid, DateRange: timeRange})

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

func handleUpdateActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage, plnStrg storage.PlanStorage, uuid uuid.UUID) {
	activity, err := parseActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	activity.Id = uuid
	activity.UserId = userId

	if activity.PlanId != nil && !validPlanId(plnStrg, activity) {
		http.Error(w, "Plan not found", http.StatusBadRequest)
		return
	}

	updateErr := strg.Update(activity)
	if updateErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))

}

func handleDeleteActivity(w http.ResponseWriter, r *http.Request, strg storage.ActivityStorage, uuid uuid.UUID) {
	storedActivity, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

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
