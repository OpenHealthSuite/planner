package storage

import (
	"encoding/json"
	"errors"

	"github.com/gocql/gocql"
	"github.com/google/uuid"
)

type CassandraRecurringActivityStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraRecurringActivityStorage) Create(activity RecurringActivity) (RecurringActivity, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return RecurringActivity{}, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	newId := uuid.New()
	insertCQL := `
			INSERT INTO ohs_planner.recurring_activities (
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
	var planIdString *string
	if activity.PlanId != nil {
		dirString := activity.PlanId.String()
		planIdString = &dirString
	}
	insertErr := session.Query(insertCQL,
		newId.String(),
		activity.UserId,
		planIdString,
		activity.Summary,
		jsonStr,
		activity.RecurrEachDays,
		activity.DateTimeStart,
		activity.TimeRelevant,
	).Exec()
	if insertErr != nil {
		return activity, insertErr
	}
	activity.Id = newId
	return activity, nil
}

func (stg CassandraRecurringActivityStorage) Read(userId string, id uuid.UUID) (*RecurringActivity, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return nil, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	selectCQL := `
			SELECT 
				id,
				userId,
				planId,
				summary,
				stages,
				recurrEachDays,
				dateTimeStart,
				timeRelevant
			FROM ohs_planner.recurring_activities 
			WHERE userId = ? AND id = ?
			LIMIT 1;
	`
	scanner := session.Query(selectCQL, userId, id.String()).Iter().Scanner()
	if scanner.Next() {
		var activity RecurringActivity
		rawStages := "[]"
		rawId := ""
		rawPlanId := ""
		err = scanner.Scan(
			&rawId,
			&activity.UserId,
			&rawPlanId,
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
		activity.Id = uuid.MustParse(rawId)
		if rawPlanId != "" {
			dirRef := uuid.MustParse(rawPlanId)
			activity.PlanId = &dirRef
		}
		return &activity, nil
	}
	return nil, nil
}

func (stg CassandraRecurringActivityStorage) Query(query RecurringActivityStorageQuery) (*[]RecurringActivity, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return nil, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	params := []interface{}{query.UserId}
	selectCQL := `
	SELECT 
		id,
		userId,
		planId,
		summary,
		stages,
		recurrEachDays,
		dateTimeStart,
		timeRelevant
	FROM ohs_planner.recurring_activities 
	WHERE userId = ?`
	if query.PlanId != nil {
		selectCQL = selectCQL + ` AND planId = ?`
		params = append(params, query.PlanId.String())
	}
	if query.PlanId != nil {
		selectCQL = selectCQL + ` ALLOW FILTERING`
	}
	rows := session.Query(selectCQL, params...).Iter().Scanner()
	activities := make([]RecurringActivity, 0)
	// Print the results of the query
	for rows.Next() {
		var activity RecurringActivity
		rawStages := "[]"
		rawId := ""
		rawPlanId := ""
		err = rows.Scan(
			&rawId,
			&activity.UserId,
			&rawPlanId,
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
		activity.Id = uuid.MustParse(rawId)
		if rawPlanId != "" {
			dirRef := uuid.MustParse(rawPlanId)
			activity.PlanId = &dirRef
		}
		activities = append(activities, activity)
	}
	return &activities, nil
}

func (stg CassandraRecurringActivityStorage) Update(activity RecurringActivity) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	updateCQL := `
			UPDATE ohs_planner.recurring_activities
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
	var planIdString *string
	if activity.PlanId != nil {
		dirString := activity.PlanId.String()
		planIdString = &dirString
	}
	updateErr := session.Query(updateCQL,
		planIdString,
		activity.Summary,
		jsonStr,
		activity.RecurrEachDays,
		activity.DateTimeStart,
		activity.TimeRelevant,
		activity.UserId,
		activity.Id.String(),
	).Exec()
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg CassandraRecurringActivityStorage) Delete(userId string, id uuid.UUID) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	deleteCQL := `
			DELETE FROM ohs_planner.recurring_activities
			WHERE userId = ? AND id = ?;
	`
	deleteErr := session.Query(deleteCQL, userId, id.String()).Exec()
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func (stg CassandraRecurringActivityStorage) DeleteForPlan(userId string, planId uuid.UUID) error {
	planActivities, err := stg.Query(RecurringActivityStorageQuery{UserId: userId, PlanId: &planId})
	if err != nil {
		return err
	}
	if len(*planActivities) == 0 {
		return nil
	}
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	params := make([]interface{}, 0)
	params = append(params, userId)
	for _, value := range *planActivities {
		activityId := value.Id.String()
		params = append(params, activityId)
	}
	deleteCQL := `
			DELETE FROM ohs_planner.recurring_activities
			WHERE userId = ? AND id IN (`
	for i := 1; i < len(params); i++ {
		deleteCQL = deleteCQL + "?,"
	}
	deleteCQL = deleteCQL[:len(deleteCQL)-1]
	deleteCQL = deleteCQL + ")"

	deleteErr := session.Query(deleteCQL, params...).Exec()
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}
