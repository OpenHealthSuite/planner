package storage

import (
	"errors"
	"time"

	"github.com/google/uuid"
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
	Id                  uuid.UUID       `json:"id"`
	RecurringActivityId *uuid.UUID      `json:"recurringActivityId"`
	UserId              string          `json:"userId"`
	PlanId              *uuid.UUID      `json:"planId"`
	Summary             string          `json:"summary"`
	Stages              []ActivityStage `json:"stages"`
	DateTime            time.Time       `json:"dateTime"`
	TimeRelevant        bool            `json:"timeRelevant"`
	Completed           bool            `json:"completed"`
	Notes               string          `json:"notes"`
}

type RecurringActivity struct {
	Id             uuid.UUID       `json:"id"`
	UserId         string          `json:"userId"`
	PlanId         *uuid.UUID      `json:"planId"`
	Summary        string          `json:"summary"`
	Stages         []ActivityStage `json:"stages"`
	RecurrEachDays int32           `json:"recurrEachDays"`
	DateTimeStart  time.Time       `json:"dateTimeStart"`
	TimeRelevant   bool            `json:"timeRelevant"`
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
	UserId    string
	PlanId    *uuid.UUID
	DateRange *DateRange
}

type RecurringActivityStorageQuery struct {
	UserId string
	PlanId *uuid.UUID
}

type PlanStorageQuery struct {
	UserId string
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

//go:generate mockery --name RecurringActivityStorage
type RecurringActivityStorage interface {
	Create(activity RecurringActivity) (RecurringActivity, error)
	Read(userId string, id uuid.UUID) (*RecurringActivity, error)
	Query(query RecurringActivityStorageQuery) (*[]RecurringActivity, error)
	Update(activity RecurringActivity) error
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
	Activity          ActivityStorage
	RecurringActivity RecurringActivityStorage
	Plan              PlanStorage
}

type StorageType string

const (
	Sqlite    StorageType = "sqlite"
	Cassandra StorageType = "cassandra"
)

func GetStorage(storage_type StorageType) (Storage, error) {
	if storage_type == Sqlite {
		strg, err := getSqliteStorageClient(".sqlite")
		return strg, err
	}
	if storage_type == Cassandra {
		strg, err := getCassandratorageClient()
		return strg, err
	}
	return Storage{}, errors.New("Not Implemented")
}
