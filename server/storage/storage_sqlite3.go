package storage

import (
	"database/sql"
	"encoding/json"
	"time"

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
				planId,
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
		activity.PlanId,
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

func (stg Sqlite3ActivityStorage) Read(userId string, id uuid.UUID) (*Activity, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				planId,
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
			&activity.PlanId,
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
	var startTime *time.Time
	var endTime *time.Time
	if query.DateRange != nil {
		startTime = &query.DateRange.Start
		endTime = &query.DateRange.End
	}
	selectSQL := `
	SELECT 
		id,
		userId,
		planId,
		summary,
		stages,
		dateTime,
		timeRelevant,
		completed,
		notes
	FROM activities 
	WHERE userId = ?
	AND (? IS NULL OR planId = ?)
	AND (? IS NULL OR (dateTime > ? AND dateTime < ?));
`
	rows, err := stg.DB.Query(selectSQL,
		query.UserId,
		query.PlanId, query.PlanId,
		startTime, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	activities := make([]Activity, 0)
	// Print the results of the query
	for rows.Next() {
		var activity Activity
		rawStages := "[]"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.PlanId,
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
	updateSQL := `
			UPDATE activities
			SET 
				userId = ?,
				planId = ?,
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
	_, updateErr := stg.DB.Exec(updateSQL,
		activity.UserId,
		activity.PlanId,
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

func (stg Sqlite3ActivityStorage) Delete(userId string, id uuid.UUID) error {
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

func (stg Sqlite3ActivityStorage) DeleteForPlan(userId string, planId uuid.UUID) error {
	deleteSQL := `
			DELETE FROM activities
			WHERE planId = ?;
	`
	_, deleteErr := stg.DB.Exec(deleteSQL, planId)
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

type Sqlite3PlanStorage struct {
	DB *sql.DB
}

func (stg Sqlite3PlanStorage) Create(plan Plan) (Plan, error) {
	newId := uuid.New()
	insertSQL := `
			INSERT INTO plans (
				id,
				userId,
				name,
				active
			)
			VALUES (
				?,
				?,
				?,
				?
			);
	`
	_, insertErr := stg.DB.Exec(insertSQL,
		newId,
		plan.UserId,
		plan.Name,
		plan.Active,
	)
	if insertErr != nil {
		return plan, insertErr
	}
	plan.Id = newId
	return plan, nil
}

func (stg Sqlite3PlanStorage) Read(userId string, id uuid.UUID) (*Plan, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				name,
				active
			FROM plans 
			WHERE id = ?;
	`
	rows, err := stg.DB.Query(selectSQL, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		var plan Plan
		err = rows.Scan(
			&plan.Id,
			&plan.UserId,
			&plan.Name,
			&plan.Active,
		)
		if err != nil {
			return nil, err
		}
		return &plan, nil
	}
	return nil, nil
}

func (stg Sqlite3PlanStorage) Query(query PlanStorageQuery) (*[]Plan, error) {
	selectSQL := `
	SELECT 
		id,
		userId,
		name,
		active
	FROM plans 
	WHERE userId = ?;
`
	rows, err := stg.DB.Query(selectSQL, query.UserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	plans := make([]Plan, 0)
	for rows.Next() {
		var plan Plan
		err = rows.Scan(
			&plan.Id,
			&plan.UserId,
			&plan.Name,
			&plan.Active,
		)
		if err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}
	return &plans, nil
}

func (stg Sqlite3PlanStorage) Update(plan Plan) error {
	insertSQL := `
			UPDATE plans
			SET 
				userId = ?,
				name = ?,
				active = ?
			WHERE id = ?;
	`
	_, updateErr := stg.DB.Exec(insertSQL,
		plan.UserId,
		plan.Name,
		plan.Active,
		plan.Id,
	)
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg Sqlite3PlanStorage) Delete(userId string, id uuid.UUID) error {
	deleteSQL := `
			DELETE FROM plans
			WHERE id = ?;
	`
	_, deleteErr := stg.DB.Exec(deleteSQL, id)
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func getSqliteStorageClient(filepath string) (Storage, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return Storage{}, err
	}
	// Do migrations
	migrations := []string{`
	CREATE TABLE IF NOT EXISTS activities (
			id TEXT PRIMARY KEY,
			userId TEXT,
			planId TEXT NULL,
			summary TEXT,
			stages TEXT,
			dateTime DATETIME,
			timeRelevant BOOLEAN,
			completed BOOLEAN,
			notes TEXT
	);`,
		`CREATE TABLE IF NOT EXISTS plans (
			id TEXT PRIMARY KEY,
			userId TEXT,
			name TEXT,
			active BOOLEAN
	);
	`}
	for _, migration := range migrations {
		_, err = db.Exec(migration)
		if err != nil {
			return Storage{}, err
		}
	}
	return Storage{
		Activity: Sqlite3ActivityStorage{DB: db},
		Plan:     Sqlite3PlanStorage{DB: db},
	}, nil
}
