package storage

import (
	"os"
	"time"

	"github.com/google/uuid"
)

type ActivityType string

const (
	ActivityRunning ActivityType = "running"
	ActivityCycling ActivityType = "cycling"
	ActivityOther   ActivityType = "other"
)

type ActivityStageMetric struct {
	Amount int    `json:"amount"`
	Unit   string `json:"unit"`
}

type ActivityStage struct {
	Order       int                   `json:"order"`
	Description string                `json:"description"`
	Metrics     []ActivityStageMetric `json:"metrics"`
	Repetitions int                   `json:"repetitions"`
}

type Activity struct {
	Id           uuid.UUID       `json:"id"`
	UserId       string          `json:"userId"`
	PlanId       *uuid.UUID      `json:"planId"`
	Summary      string          `json:"summary"`
	Stages       []ActivityStage `json:"stages"`
	DateTime     time.Time       `json:"dateTime"`
	TimeRelevant bool            `json:"timeRelevant"`
	Completed    bool            `json:"completed"`
	Notes        string          `json:"notes"`
}

type Plan struct {
	Id     uuid.UUID `json:"id"`
	UserId string    `json:"userId"`
	Name   string    `json:"name"`
	Active bool      `json:"active"`
}

type DateRange struct {
	Start time.Time
	End   time.Time
}

type ActivityStorageQuery struct {
	UserId    *string
	PlanId    *uuid.UUID
	DateRange *DateRange
}

type PlanStorageQuery struct {
	UserId *string
}

//go:generate mockery --name ActivityStorage
type ActivityStorage interface {
	Create(activity Activity) (Activity, error)
	Read(userId string, id uuid.UUID) (*Activity, error)
	Query(query ActivityStorageQuery) (*[]Activity, error)
	Update(activity Activity) error
	Delete(userId string, id uuid.UUID) error
	DeleteForPlan(userId string, planId uuid.UUID) error
}

//go:generate mockery --name PlanStorage
type PlanStorage interface {
	Create(plan Plan) (Plan, error)
	Read(userId string, id uuid.UUID) (*Plan, error)
	Query(query PlanStorageQuery) (*[]Plan, error)
	Update(plan Plan) error
	Delete(userId string, id uuid.UUID) error
}

type Storage struct {
	Activity ActivityStorage
	Plan     PlanStorage
}

func GetStorage() Storage {
	// TODO: This is how we should get storage
	// TODO: When there is more than SQLite3, configure here
	// TODO: Also probably want to make this something that only
	// gets generated once
	strg, err := getSqliteStorageClient(".sqlite")
	if err != nil {
		os.Exit(500)
	}
	return strg
}
