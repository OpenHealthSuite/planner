package storage

import (
	"testing"

	"github.com/google/uuid"
)

func TestCreateReadUpdateDelete(t *testing.T) {
	storage, err := getSqliteStorageClient(":memory:")
	if err != nil {
		//t.Errorf("Add(2, 3) = %d; want 5", result)
		t.Error("Error creating storage")
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
}
