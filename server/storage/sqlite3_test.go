package storage

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCreateReadUpdateDelete(t *testing.T) {
	storage, err := getSqliteStorageClient(":memory:")
	if err != nil {
		//t.Errorf("Add(2, 3) = %d; want 5", result)
		t.Errorf("Error creating storage: %s", err.Error())
		return
	}
	res, err := storage.Read(uuid.New())
	if err != nil {
		t.Error("Error reading with empty uuid")
		return
	}
	if res != nil {
		t.Error("somehow got result on random uuid?")
		return
	}
	createActivity := Activity{
		UserId:  "test-user-id",
		Summary: "Test Item",
		Stages: []ActivityStage{
			{
				Order:       0,
				Description: "stg 1",
				Metrics: []ActivityStageMetric{{
					Amount: 5,
					Unit:   "minutes",
				}},
				Repetitions: 6,
			},
		},
		DateTime:     time.Now(),
		TimeRelevant: false,
		Completed:    false,
		Notes:        "",
	}
	created, err := storage.Create(createActivity)
	if err != nil {
		t.Error("Error creating activity")
		return
	}
	if created.Id == uuid.MustParse("00000000-0000-0000-0000-000000000000") {
		t.Error("Got 0 uuid")
		return
	}
	if created.Summary != createActivity.Summary {
		t.Error("Error with created activity")
		return
	}

	read, err := storage.Read(created.Id)
	if err != nil {
		t.Errorf("Error reading activity %s", err)
		return
	}
	if read.Stages[0].Description != createActivity.Stages[0].Description {
		t.Error("Error with read stage")
		return
	}

	updateActivity := read

	updateActivity.Summary = "Updated Activity Name"

	updateErr := storage.Update(*updateActivity)

	if updateErr != nil {
		t.Errorf("Error updating activity %s", updateErr)
		return
	}

	reread, err := storage.Read(created.Id)
	if err != nil {
		t.Errorf("Error reading activity %s", err)
		return
	}
	if reread.Summary != updateActivity.Summary {
		t.Error("Error with reread updated activity")
		return
	}

	query, err := storage.Query(ActivityStorageQuery{
		UserId: &read.UserId,
	})

	if err != nil {
		t.Errorf("Error querying activity %s", err)
		return
	}
	if len(*query) != 1 {
		t.Error("Error with count of stored items")
		return
	}
	if (*query)[0].Id != read.Id {
		t.Error("Error with queried activity")
		return
	}

	deleteErr := storage.Delete(read.Id)

	if deleteErr != nil {
		t.Errorf("Error deleting activity %s", deleteErr)
		return
	}

	rereread, err := storage.Read(read.Id)
	if err != nil {
		t.Errorf("Error rerereading activity %s", err)
		return
	}
	if rereread != nil {
		t.Error("Error got deleted activity")
		return
	}

}
