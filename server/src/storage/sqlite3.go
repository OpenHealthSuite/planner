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

func (stg Sqlite3ActivityStorage) Create(activity Activity) (*Activity, error) {
	newId := uuid.New()
	insertSQL := `
			INSERT INTO activities (
				id,
				userId,
				name,
				type,
				attributes,
				details,
				dateTime,
				timeRelevant,
				durationMinutes,
				completed
			)
			VALUES (
				?,
				?,
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
	jsonStr, err := json.Marshal(activity.Attributes)
	if err != nil {
		return nil, err
	}
	_, insertErr := stg.DB.Exec(insertSQL,
		newId,
		activity.UserId,
		activity.Name,
		activity.Type,
		jsonStr,
		activity.Details,
		activity.DateTime,
		activity.TimeRelevant,
		activity.DurationMinutes,
		activity.Completed,
	)
	if insertErr != nil {
		return nil, insertErr
	}
	activity.Id = newId
	return &activity, nil
}

func (stg Sqlite3ActivityStorage) Read(id uuid.UUID) (*Activity, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				name,
				type,
				attributes,
				details,
				dateTime,
				timeRelevant,
				durationMinutes,
				completed
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
		rawAttributes := "{}"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.Name,
			&activity.Type,
			&rawAttributes,
			&activity.Details,
			&activity.DateTime,
			&activity.TimeRelevant,
			&activity.DurationMinutes,
			&activity.Completed,
		)
		if err != nil {
			return nil, err
		}
		err := json.Unmarshal([]byte(rawAttributes), &activity.Attributes)
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
		name,
		type,
		attributes,
		details,
		dateTime,
		timeRelevant,
		durationMinutes,
		completed
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
		rawAttributes := "{}"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.Name,
			&activity.Type,
			&rawAttributes,
			&activity.Details,
			&activity.DateTime,
			&activity.TimeRelevant,
			&activity.DurationMinutes,
			&activity.Completed,
		)
		if err != nil {
			return nil, err
		}
		err := json.Unmarshal([]byte(rawAttributes), &activity.Attributes)
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
				name = ?,
				type = ?,
				attributes = ?,
				details = ?,
				dateTime = ?,
				timeRelevant = ?,
				durationMinutes = ?,
				completed = ?
			WHERE id = ?;
	`
	jsonStr, err := json.Marshal(activity.Attributes)
	if err != nil {
		return err
	}
	_, updateErr := stg.DB.Exec(insertSQL,
		activity.UserId,
		activity.Name,
		activity.Type,
		jsonStr,
		activity.Details,
		activity.DateTime,
		activity.TimeRelevant,
		activity.DurationMinutes,
		activity.Completed,
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
			name TEXT,
			type TEXT,
			attributes TEXT,
			details TEXT NULL,
			dateTime DATETIME,
			timeRelevant BOOLEAN,
			durationMinutes INTEGER NULL,
			completed BOOLEAN
	);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}
	strg := Sqlite3ActivityStorage{DB: db}
	return strg, nil
}
