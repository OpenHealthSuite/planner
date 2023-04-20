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

func AddPlanHandlers(mux *http.ServeMux, strg storage.PlanStorage, useridMiddleware middlewares.Middleware) {
	mux.Handle("/api/plans", useridMiddleware(registerPlanRoot(strg)))
	mux.Handle("/api/plans/", useridMiddleware(registerPlanId(strg)))
}

func registerPlanRoot(strg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleCreatePlan(w, r, strg)
		} else if r.Method == http.MethodGet {
			handleUserQueryPlan(w, r, strg)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}
}

func registerPlanId(strg storage.PlanStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(r.URL.Path, "/")
		id := parts[3]

		uuid, err := uuid.Parse(id)

		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if r.Method == http.MethodPut {
			handleUpdatePlan(w, r, strg, uuid)
		} else if r.Method == http.MethodGet {
			handleReadPlan(w, r, strg, uuid)
		} else if r.Method == http.MethodDelete {
			handleDeletePlan(w, r, strg, uuid)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Invalid method: %s", r.Method)
		}
	}

}

func parsePlan(rdr io.Reader) (storage.Plan, error) {
	var plan storage.Plan
	decoder := json.NewDecoder(rdr)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(&plan)
	return plan, err
}

func handleCreatePlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage) {
	plan, err := parsePlan(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	plan.UserId = w.Header().Get(middlewares.VALIDATED_HEADER)

	created, err := strg.Create(plan)
	jsonData, err := json.Marshal(created.Id.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func handleReadPlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage, uuid uuid.UUID) {
	storedPlan, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	if storedPlan == nil || storedPlan.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	jsonData, err := json.Marshal(storedPlan)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

// TODO: Skipping tests until query gets more complex
func handleUserQueryPlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage) {
	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	queried, err := strg.Query(storage.PlanStorageQuery{UserId: &userId})

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

func handleUpdatePlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage, uuid uuid.UUID) {
	plan, err := parsePlan(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedPlan, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	if storedPlan == nil || storedPlan.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	plan.Id = uuid
	plan.UserId = userId

	updateErr := strg.Update(plan)
	if updateErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))

}

func handleDeletePlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage, uuid uuid.UUID) {
	storedPlan, err := strg.Read(uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	if storedPlan == nil || storedPlan.UserId != userId {
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
