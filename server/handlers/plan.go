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

func AddPlanHandlers(mux *http.ServeMux, strg storage.PlanStorage, actStrg storage.ActivityStorage, recActStrg storage.RecurringActivityStorage, useridMiddleware middlewares.Middleware) {
	mux.Handle("/api/plans", useridMiddleware(registerPlanRoot(strg)))
	mux.Handle("/api/plans/", useridMiddleware(registerPlanId(strg, actStrg, recActStrg)))
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

func registerPlanId(strg storage.PlanStorage, actStrg storage.ActivityStorage, recActStrg storage.RecurringActivityStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(r.URL.Path, "/")
		id := parts[3]

		if id == "clone" && r.Method == http.MethodPost {
			handleClonePlan(w, r, strg, actStrg, recActStrg)
			return
		}

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
			handleDeletePlan(w, r, strg, actStrg, recActStrg, uuid)
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

type PlanClone struct {
	Id               string     `json:"id"`
	NewStartDateTime *time.Time `json:"newStartDateTime,omitempty"`
	NewEndDateTime   *time.Time `json:"newEndDateTime,omitempty"`
}

func parsePlanClone(rdr io.Reader) (PlanClone, error) {
	var plan PlanClone
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

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	storedPlan, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
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

func handleUserQueryPlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage) {
	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	queried, err := strg.Query(storage.PlanStorageQuery{UserId: userId})

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

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	plan, err := parsePlan(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedPlan, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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

func handleDeletePlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage, actStrg storage.ActivityStorage, recActStrg storage.RecurringActivityStorage, uuid uuid.UUID) {

	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	storedPlan, err := strg.Read(userId, uuid)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if storedPlan == nil || storedPlan.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	deleteErr := strg.Delete(userId, uuid)
	if deleteErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	activityDeleteErr := actStrg.DeleteForPlan(userId, uuid)
	if activityDeleteErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	recActDeleteErr := recActStrg.DeleteForPlan(userId, uuid)
	if recActDeleteErr != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{ "status": "ok" }`))
}

func handleClonePlan(w http.ResponseWriter, r *http.Request, strg storage.PlanStorage, actStrg storage.ActivityStorage, recActStrg storage.RecurringActivityStorage) {
	userId := w.Header().Get(middlewares.VALIDATED_HEADER)

	plan, err := parsePlanClone(r.Body)

	id, err := uuid.Parse(plan.Id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if plan.NewStartDateTime == nil && plan.NewEndDateTime == nil {
		http.Error(w, "Need to provide newStartDateTime or newEndDateTime", http.StatusBadRequest)
		return
	}

	if plan.NewStartDateTime != nil && plan.NewEndDateTime != nil {
		http.Error(w, "Need to provide either newStartDateTime or newEndDateTime", http.StatusBadRequest)
		return
	}

	storedPlan, err := strg.Read(userId, id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if storedPlan == nil || storedPlan.UserId != userId {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	newPlan := *storedPlan

	newPlan.Id = uuid.Nil
	newPlan.Name = "Cloned - " + storedPlan.Name

	created, err := strg.Create(newPlan)
	str := created.Id.String()
	jsonData, err := json.Marshal(str)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = cloneActivities(actStrg, userId, storedPlan.Id, created.Id, plan.NewStartDateTime, plan.NewEndDateTime)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func cloneActivities(actStrg storage.ActivityStorage, userId string, originPlanId uuid.UUID, targetPlanId uuid.UUID, newStartDate *time.Time, newEndDate *time.Time) error {
	acts, err := actStrg.Query(storage.ActivityStorageQuery{
		UserId: userId,
		PlanId: &originPlanId,
	})

	if err != nil {
		return err
	}

	if len(*acts) == 0 {
		return nil
	}

	var offset *time.Duration

	for _, oldAct := range *acts {
		if newStartDate != nil {
			newDuration := (*newStartDate).Sub(oldAct.DateTime)
			if offset == nil || *offset < newDuration {
				offset = &newDuration
			}
		}
		if newEndDate != nil {
			newDuration := (*newEndDate).Sub(oldAct.DateTime)
			if offset == nil || *offset > newDuration {
				offset = &newDuration
			}
		}
	}

	for _, oldAct := range *acts {
		oldAct.Id = uuid.Nil
		oldAct.DateTime = oldAct.DateTime.Add(*offset)
		oldAct.PlanId = &targetPlanId
		oldAct.Completed = false
		_, err := actStrg.Create(oldAct)
		if err != nil {
			fmt.Printf("Error creating new activity:\n\n%v", err)
		}
	}

	return nil
}
