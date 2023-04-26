package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"planner/middlewares"
	"planner/storage"
	"strings"

	"github.com/google/uuid"
)

func AddRecurringActivityHandlers(mux *http.ServeMux, strg storage.RecurringActivityStorage, plnStrg storage.PlanStorage, useridMiddleware middlewares.Middleware) {
	mux.Handle("/api/recurring_activities", useridMiddleware(registerRecurringActivityRoot(strg, plnStrg)))
	mux.Handle("/api/recurring_activities/", useridMiddleware(registerRecurringActivityId(strg, plnStrg)))
}

func registerRecurringActivityRoot(strg storage.RecurringActivityStorage, plnStrg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleCreateRecurringActivity(w, r, strg, plnStrg)
		} else if r.Method == http.MethodGet {
			handleUserQueryRecurringActivity(w, r, strg)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}
}

func registerRecurringActivityId(strg storage.RecurringActivityStorage, plnStrg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(r.URL.Path, "/")
		id := parts[3]

		uuid, err := uuid.Parse(id)

		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if r.Method == http.MethodPut {
			handleUpdateRecurringActivity(w, r, strg, plnStrg, uuid)
		} else if r.Method == http.MethodGet {
			handleReadRecurringActivity(w, r, strg, uuid)
		} else if r.Method == http.MethodDelete {
			handleDeleteRecurringActivity(w, r, strg, uuid)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}

}

func parseRecurringActivity(rdr io.Reader) (storage.RecurringActivity, error) {
	var activity storage.RecurringActivity
	decoder := json.NewDecoder(rdr)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(&activity)
	return activity, err
}

func handleCreateRecurringActivity(w http.ResponseWriter, r *http.Request, strg storage.RecurringActivityStorage, plnStrg storage.PlanStorage) {
	activity, err := parseRecurringActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activity.UserId = w.Header().Get(middlewares.VALIDATED_HEADER)

	if activity.PlanId != nil && !validRecurringPlanId(plnStrg, activity) {
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

func validRecurringPlanId(plnStrg storage.PlanStorage, activity storage.RecurringActivity) bool {
	plan, err := plnStrg.Read(activity.UserId, *activity.PlanId)
	if plan == nil || plan.UserId != activity.UserId || err != nil {
		return false
	}
	return true
}

func handleReadRecurringActivity(w http.ResponseWriter, r *http.Request, strg storage.RecurringActivityStorage, uuid uuid.UUID) {
	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	storedActivity, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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

func handleUserQueryRecurringActivity(w http.ResponseWriter, r *http.Request, strg storage.RecurringActivityStorage) {
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

	queried, err := strg.Query(storage.RecurringActivityStorageQuery{UserId: userId, PlanId: planid})

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

func handleUpdateRecurringActivity(w http.ResponseWriter, r *http.Request, strg storage.RecurringActivityStorage, plnStrg storage.PlanStorage, uuid uuid.UUID) {

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	activity, err := parseRecurringActivity(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedActivity, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	activity.Id = uuid
	activity.UserId = userId

	if activity.PlanId != nil && !validRecurringPlanId(plnStrg, activity) {
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

func handleDeleteRecurringActivity(w http.ResponseWriter, r *http.Request, strg storage.RecurringActivityStorage, uuid uuid.UUID) {

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	storedActivity, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if storedActivity == nil || storedActivity.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	deleteErr := strg.Delete(userId, uuid)
	if deleteErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))
}
