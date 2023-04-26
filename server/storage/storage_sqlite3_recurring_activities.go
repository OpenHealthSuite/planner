package storage

import (
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type Sqlite3RecurringActivityStorage struct {
	DB *sql.DB
}

func (stg Sqlite3RecurringActivityStorage) Create(activity RecurringActivity) (RecurringActivity, error) {
	newId := uuid.New()
	insertSQL := `
			INSERT INTO recurring_activities (
				id,
				userId,
				planId,
				summary,
				stages,
				recurrEachDays,
				dateTimeStart,
				timeRelevant
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
		activity.PlanId,
		activity.Summary,
		jsonStr,
		activity.RecurrEachDays,
		activity.DateTimeStart,
		activity.TimeRelevant,
	)
	if insertErr != nil {
		return activity, insertErr
	}
	activity.Id = newId
	return activity, nil
}

func (stg Sqlite3RecurringActivityStorage) Read(userId string, id uuid.UUID) (*RecurringActivity, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				planId,
				summary,
				stages,
				recurrEachDays,
				dateTimeStart,
				timeRelevant
			FROM recurring_activities 
			WHERE id = ?;
	`
	rows, err := stg.DB.Query(selectSQL, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Print the results of the query
	if rows.Next() {
		var activity RecurringActivity
		rawStages := "[]"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.PlanId,
			&activity.Summary,
			&rawStages,
			&activity.RecurrEachDays,
			&activity.DateTimeStart,
			&activity.TimeRelevant,
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

func (stg Sqlite3RecurringActivityStorage) Query(query RecurringActivityStorageQuery) (*[]RecurringActivity, error) {
	selectSQL := `
	SELECT 
		id,
		userId,
		planId,
		summary,
		stages,
		recurrEachDays,
		dateTimeStart,
		timeRelevant
	FROM recurring_activities 
	WHERE userId = ?
	AND (? IS NULL OR planId = ?);
`
	rows, err := stg.DB.Query(selectSQL,
		query.UserId,
		query.PlanId, query.PlanId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	activities := make([]RecurringActivity, 0)
	// Print the results of the query
	for rows.Next() {
		var activity RecurringActivity
		rawStages := "[]"
		err = rows.Scan(
			&activity.Id,
			&activity.UserId,
			&activity.PlanId,
			&activity.Summary,
			&rawStages,
			&activity.RecurrEachDays,
			&activity.DateTimeStart,
			&activity.TimeRelevant,
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

func (stg Sqlite3RecurringActivityStorage) Update(activity RecurringActivity) error {
	updateSQL := `
			UPDATE recurring_activities
			SET 
				planId = ?,
				summary = ?,
				stages = ?,
				recurrEachDays = ?,
				dateTimeStart = ?,
				timeRelevant = ?
			WHERE userId = ? AND id = ?;
	`
	jsonStr, err := json.Marshal(activity.Stages)
	if err != nil {
		return err
	}
	_, updateErr := stg.DB.Exec(updateSQL,
		activity.PlanId,
		activity.Summary,
		jsonStr,
		activity.RecurrEachDays,
		activity.DateTimeStart,
		activity.TimeRelevant,
		activity.UserId,
		activity.Id,
	)
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg Sqlite3RecurringActivityStorage) Delete(userId string, id uuid.UUID) error {
	deleteSQL := `
			DELETE FROM recurring_activities
			WHERE id = ?;
	`
	_, deleteErr := stg.DB.Exec(deleteSQL, id)
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func (stg Sqlite3RecurringActivityStorage) DeleteForPlan(userId string, planId uuid.UUID) error {
	deleteSQL := `
			DELETE FROM recurring_activities
			WHERE planId = ?;
	`
	_, deleteErr := stg.DB.Exec(deleteSQL, planId)
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}
