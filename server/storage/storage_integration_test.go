package storage

import (
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestActivityCreateReadUpdateDelete(t *testing.T) {
	var allStorages []ActivityStorage
	sqliteStorage, sqliteErr := getSqliteStorageClient(":memory:")
	if sqliteErr != nil {
		t.Errorf("Error creating storage: %s", sqliteErr.Error())
		return
	}
	allStorages = append(allStorages, sqliteStorage.Activity)
	cassandraStorage, cassandraErr := getCassandratorageClient()
	if cassandraErr != nil {
		t.Errorf("Error creating cassandra storage: %s", cassandraErr.Error())
	} else {
		allStorages = append(allStorages, cassandraStorage.Activity)
	}
	for _, storage := range allStorages {
		userId := fmt.Sprintf("test-user-id-%s", uuid.New())
		res, err := storage.Read(userId, uuid.New())
		if err != nil {
			t.Error("Error reading with empty uuid")
			return
		}
		if res != nil {
			t.Error("somehow got result on random uuid?")
			return
		}
		createActivity := Activity{
			UserId:  userId,
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

		read, err := storage.Read(userId, created.Id)
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

		reread, err := storage.Read(userId, created.Id)
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

		deleteErr := storage.Delete(userId, read.Id)

		if deleteErr != nil {
			t.Errorf("Error deleting activity %s", deleteErr)
			return
		}

		rereread, err := storage.Read(userId, read.Id)
		if err != nil {
			t.Errorf("Error rerereading activity %s", err)
			return
		}
		if rereread != nil {
			t.Error("Error got deleted activity")
			return
		}
	}
}

func TestPlanCreateReadUpdateDelete(t *testing.T) {
	var allStorages []PlanStorage
	sqliteStorage, sqliteErr := getSqliteStorageClient(":memory:")
	if sqliteErr != nil {
		t.Errorf("Error creating storage: %s", sqliteErr.Error())
		return
	}
	allStorages = append(allStorages, sqliteStorage.Plan)
	cassandraStorage, cassandraErr := getCassandratorageClient()
	if cassandraErr != nil {
		t.Errorf("Error creating cassandra storage: %s", cassandraErr.Error())
	} else {
		allStorages = append(allStorages, cassandraStorage.Plan)
	}
	for _, storage := range allStorages {
		userId := fmt.Sprintf("test-user-id-%s", uuid.New())
		res, err := storage.Read(userId, uuid.New())
		if err != nil {
			t.Error("Error reading with empty uuid")
			return
		}
		if res != nil {
			t.Error("somehow got result on random uuid?")
			return
		}
		createPlan := Plan{
			UserId: userId,
			Name:   "Test Plan",
			Active: true,
		}
		created, err := storage.Create(createPlan)
		if err != nil {
			t.Errorf("Error creating plan %s", err)
			return
		}
		if created.Id == uuid.MustParse("00000000-0000-0000-0000-000000000000") {
			t.Error("Got 0 uuid")
			return
		}
		if created.Name != createPlan.Name {
			t.Error("Error with created plan")
			return
		}

		read, err := storage.Read(userId, created.Id)
		if err != nil {
			t.Errorf("Error reading plan %s", err)
			return
		}

		updatePlan := read

		updatePlan.Name = "Updated plan Name"

		updateErr := storage.Update(*updatePlan)

		if updateErr != nil {
			t.Errorf("Error updating plan %s", updateErr)
			return
		}

		reread, err := storage.Read(userId, created.Id)
		if err != nil {
			t.Errorf("Error reading plan %s", err)
			return
		}
		if reread.Name != updatePlan.Name {
			t.Error("Error with reread updated plan")
			return
		}

		query, err := storage.Query(PlanStorageQuery{
			UserId: &read.UserId,
		})

		if err != nil {
			t.Errorf("Error querying plan %s", err)
			return
		}
		if len(*query) != 1 {
			t.Error("Error with count of stored items")
			return
		}
		if (*query)[0].Id != read.Id {
			t.Error("Error with queried plan")
			return
		}

		deleteErr := storage.Delete(userId, read.Id)

		if deleteErr != nil {
			t.Errorf("Error deleting plan %s", deleteErr)
			return
		}

		rereread, err := storage.Read(userId, read.Id)
		if err != nil {
			t.Errorf("Error rerereading plan %s", err)
			return
		}
		if rereread != nil {
			t.Error("Error got deleted plan")
			return
		}
	}

}
