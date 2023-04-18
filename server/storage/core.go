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
	Summary      string          `json:"summary"`
	Stages       []ActivityStage `json:"stages"`
	DateTime     time.Time       `json:"dateTime"`
	TimeRelevant bool            `json:"timeRelevant"`
	Completed    bool            `json:"completed"`
	Notes        string          `json:"notes"`
}

type ActivityStorageQuery struct {
	UserId *string
}

//go:generate mockery --name ActivityStorage
type ActivityStorage interface {
	Create(activity Activity) (Activity, error)
	Read(id uuid.UUID) (*Activity, error)
	Query(query ActivityStorageQuery) (*[]Activity, error)
	Update(activity Activity) error
	Delete(id uuid.UUID) error
}

func GetStorage() ActivityStorage {
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
