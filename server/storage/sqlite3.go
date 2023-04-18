package storage

import (
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type Sqlite3ActivityStorage struct {
	DB *sql.DB
}

func (stg Sqlite3ActivityStorage) Create(activity Activity) (Activity, error) {
	newId := uuid.New()
	insertSQL := `
			INSERT INTO activities (
				id,
				userId,
				summary,
				stages,
				dateTime,
				timeRelevant,
				completed,
				notes
			)
			VALUES (
				?,
				?,
				?,
				?,
				?,
				?,
				?,
				?
			);
	`
	jsonStr, err := json.Marshal(activity.Stages)
	if err != nil {
		return activity, err
	}
	_, insertErr := stg.DB.Exec(insertSQL,
		newId,
		activity.UserId,
		activity.Summary,
		jsonStr,
		activity.DateTime,
		activity.TimeRelevant,
		activity.Completed,
		activity.Notes,
	)
	if insertErr != nil {
		return activity, insertErr
	}
	activity.Id = newId
	return activity, nil
}

func (stg Sqlite3ActivityStorage) Read(id uuid.UUID) (*Activity, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				summary,
				stages,
				dateTime,
				timeRelevant,
				completed,
				notes
			FROM activities 
			WHERE id = ?;
	`
	rows, err := stg.DB.Query(selectSQL, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Print the results of the query
	if rows.Next() {
		var activity Activity
		rawStages := "[]"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.Summary,
			&rawStages,
			&activity.DateTime,
			&activity.TimeRelevant,
			&activity.Completed,
			&activity.Notes,
		)
		if err != nil {
			return nil, err
		}
		err := json.Unmarshal([]byte(rawStages), &activity.Stages)
		if err != nil {
			return nil, err
		}
		return &activity, nil
	}
	return nil, nil
}

func (stg Sqlite3ActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
	selectSQL := `
	SELECT 
		id,
		userId,
		summary,
		stages,
		dateTime,
		timeRelevant,
		completed,
		notes
	FROM activities 
	WHERE userId = ?;
`
	rows, err := stg.DB.Query(selectSQL, query.UserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	activities := make([]Activity, 0)
	// Print the results of the query
	if rows.Next() {
		var activity Activity
		rawStages := "[]"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.Summary,
			&rawStages,
			&activity.DateTime,
			&activity.TimeRelevant,
			&activity.Completed,
			&activity.Notes,
		)
		if err != nil {
			return nil, err
		}
		err := json.Unmarshal([]byte(rawStages), &activity.Stages)
		if err != nil {
			return nil, err
		}
		activities = append(activities, activity)
	}
	return &activities, nil
}

func (stg Sqlite3ActivityStorage) Update(activity Activity) error {
	insertSQL := `
			UPDATE activities
			SET 
				userId = ?,
				summary = ?,
				stages = ?,
				dateTime = ?,
				timeRelevant = ?,
				completed = ?,
				notes = ?
			WHERE id = ?;
	`
	jsonStr, err := json.Marshal(activity.Stages)
	if err != nil {
		return err
	}
	_, updateErr := stg.DB.Exec(insertSQL,
		activity.UserId,
		activity.Summary,
		jsonStr,
		activity.DateTime,
		activity.TimeRelevant,
		activity.Completed,
		activity.Notes,
		activity.Id,
	)
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg Sqlite3ActivityStorage) Delete(id uuid.UUID) error {
	deleteSQL := `
			DELETE FROM activities
			WHERE id = ?;
	`
	_, deleteErr := stg.DB.Exec(deleteSQL, id)
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func getSqliteStorageClient(filepath string) (ActivityStorage, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}
	// Do migrations
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS activities (
			id TEXT PRIMARY KEY,
			userId TEXT,
			summary TEXT,
			stages TEXT,
			dateTime DATETIME,
			timeRelevant BOOLEAN,
			completed BOOLEAN,
			notes TEXT
	);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}
	strg := Sqlite3ActivityStorage{DB: db}
	return strg, nil
}
