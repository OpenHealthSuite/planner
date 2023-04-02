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
)

type Activity struct {
	Id              uuid.UUID         `json:"id"`
	UserId          string            `json:"userId"`
	Name            string            `json:"name"`
	Type            ActivityType      `json:"type"`
	Attributes      map[string]string `json:"attributes"`
	Details         *string           `json:"details"`
	DateTime        time.Time         `json:"dateTime"`
	TimeRelevant    bool              `json:"timeRelevant"`
	DurationMinutes *int32            `json:"durationMinutes"`
	Completed       bool              `json:"completed"`
}

type ActivityStorageQuery struct {
	UserId *string
}

type ActivityStorage interface {
	Create(activity Activity) (*Activity, error)
	Read(id uuid.UUID) (*Activity, error)
	Query(query ActivityStorageQuery) (*[]Activity, error)
	Update(activity Activity) error
	Delete(id uuid.UUID) error
}

func getStorage() ActivityStorage {
	// TODO: This is how we should get storage
	// TODO: When there is more than SQLite3, configure here
	// TODO: Also probably want to make this something that only
	// gets generated once
	strg, err := getSqliteStorageClient(":memory:")
	if err != nil {
		os.Exit(500)
	}
	return strg
}
