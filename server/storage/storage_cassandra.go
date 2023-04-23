package storage

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"
)

type CassandraActivityStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraActivityStorage) Create(activity Activity) (Activity, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return Activity{}, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	newId := uuid.New()
	insertCQL := `
			INSERT INTO ohs_planner.activities (
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
		activity.DateTime,
		activity.TimeRelevant,
		activity.Completed,
		activity.Notes,
	).Exec()
	if insertErr != nil {
		return activity, insertErr
	}
	activity.Id = newId
	return activity, nil
}

func (stg CassandraActivityStorage) Read(userId string, id uuid.UUID) (*Activity, error) {
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
				dateTime,
				timeRelevant,
				completed,
				notes
			FROM ohs_planner.activities 
			WHERE userId = ? AND id = ?
			LIMIT 1;
	`
	scanner := session.Query(selectCQL, userId, id.String()).Iter().Scanner()
	if scanner.Next() {
		var activity Activity
		rawStages := "[]"
		rawId := ""
		rawPlanId := ""
		err = scanner.Scan(
			&rawId,
			&activity.UserId,
			&rawPlanId,
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
		activity.Id = uuid.MustParse(rawId)
		if rawPlanId != "" {
			dirRef := uuid.MustParse(rawPlanId)
			activity.PlanId = &dirRef
		}
		return &activity, nil
	}
	return nil, nil
}

func (stg CassandraActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
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
		dateTime,
		timeRelevant,
		completed,
		notes
	FROM ohs_planner.activities 
	WHERE userId = ?`
	if query.PlanId != nil {
		selectCQL = selectCQL + ` AND planId = ?`
		params = append(params, query.PlanId.String())
	}
	if query.DateRange != nil {
		selectCQL = selectCQL + ` AND dateTime > ? AND dateTime < ?`
		params = append(params, query.DateRange.Start.String())
		params = append(params, query.DateRange.End.String())
	}
	if query.PlanId != nil || query.DateRange != nil {
		selectCQL = selectCQL + ` ALLOW FILTERING`
	}
	rows := session.Query(selectCQL, params...).Iter().Scanner()
	activities := make([]Activity, 0)
	// Print the results of the query
	for rows.Next() {
		var activity Activity
		rawStages := "[]"
		rawId := ""
		rawPlanId := ""
		err = rows.Scan(
			&rawId,
			&activity.UserId,
			&rawPlanId,
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
		activity.Id = uuid.MustParse(rawId)
		if rawPlanId != "" {
			dirRef := uuid.MustParse(rawPlanId)
			activity.PlanId = &dirRef
		}
		activities = append(activities, activity)
	}
	return &activities, nil
}

func (stg CassandraActivityStorage) Update(activity Activity) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	updateCQL := `
			UPDATE ohs_planner.activities
			SET 
				planId = ?,
				summary = ?,
				stages = ?,
				dateTime = ?,
				timeRelevant = ?,
				completed = ?,
				notes = ?
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
		activity.DateTime,
		activity.TimeRelevant,
		activity.Completed,
		activity.Notes,
		activity.UserId,
		activity.Id.String(),
	).Exec()
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg CassandraActivityStorage) Delete(userId string, id uuid.UUID) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	deleteCQL := `
			DELETE FROM ohs_planner.activities
			WHERE userId = ? AND id = ?;
	`
	deleteErr := session.Query(deleteCQL, userId, id.String()).Exec()
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func (stg CassandraActivityStorage) DeleteForPlan(userId string, planId uuid.UUID) error {
	planActivities, err := stg.Query(ActivityStorageQuery{UserId: userId, PlanId: &planId})
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
			DELETE FROM ohs_planner.activities
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

type CassandraPlanStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraPlanStorage) Create(plan Plan) (Plan, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return Plan{}, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	newId := uuid.New()
	insertCQL := `
			INSERT INTO ohs_planner.plans (
				userId,
				id,
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
	insertErr := session.Query(insertCQL,
		plan.UserId,
		newId.String(),
		plan.Name,
		plan.Active,
	).Exec()
	if insertErr != nil {
		return plan, insertErr
	}
	plan.Id = newId
	return plan, nil
}

func (stg CassandraPlanStorage) Read(userId string, id uuid.UUID) (*Plan, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return nil, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	selectCQL := `
			SELECT 
			id,
			userId,
			name,
			active
			FROM ohs_planner.plans 
			WHERE userId = ? AND id = ?
			LIMIT 1;
	`
	scanner := session.Query(selectCQL, userId, id.String()).Iter().Scanner()
	if scanner.Next() {
		var plan Plan
		rawId := ""
		err = scanner.Scan(
			&rawId,
			&plan.UserId,
			&plan.Name,
			&plan.Active,
		)
		if err != nil {
			return nil, err
		}
		plan.Id = uuid.MustParse(rawId)
		return &plan, nil
	}
	return nil, nil
}

func (stg CassandraPlanStorage) Query(query PlanStorageQuery) (*[]Plan, error) {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return nil, errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	selectCQL := `
			SELECT 
			id,
			userId,
			name,
			active
			FROM ohs_planner.plans 
			WHERE userId = ?;
	`
	scanner := session.Query(selectCQL, query.UserId).Iter().Scanner()
	plans := make([]Plan, 0)
	for scanner.Next() {
		var plan Plan
		rawId := ""
		err = scanner.Scan(
			&rawId,
			&plan.UserId,
			&plan.Name,
			&plan.Active,
		)
		if err != nil {
			return nil, err
		}
		plan.Id = uuid.MustParse(rawId)
		plans = append(plans, plan)
	}
	return &plans, nil
}

func (stg CassandraPlanStorage) Update(plan Plan) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	updateCQL := `
			UPDATE ohs_planner.plans
			SET 
				name = ?,
				active = ?
			WHERE userId = ? AND id = ?;
	`
	updateErr := session.Query(updateCQL,
		plan.Name,
		plan.Active,
		plan.UserId,
		plan.Id.String(),
	).Exec()
	if updateErr != nil {
		return updateErr
	}
	return nil
}

func (stg CassandraPlanStorage) Delete(userId string, id uuid.UUID) error {
	session, err := stg.Cluster.CreateSession()
	if err != nil {
		return errors.New("Cassandra Connection Error")
	}
	defer session.Close()
	deleteCQL := `
			DELETE FROM ohs_planner.plans
			WHERE userId = ? AND id = ?;
	`
	deleteErr := session.Query(deleteCQL, userId, id.String()).Exec()
	if deleteErr != nil {
		return deleteErr
	}
	return nil
}

func getCassandratorageClient() (Storage, error) {
	cluster := gocql.NewCluster("localhost:9042")
	cluster.Authenticator = gocql.PasswordAuthenticator{Username: "cassandra", Password: "cassandra"}
	cluster.Consistency = gocql.Quorum
	cluster.ProtoVersion = 4
	cluster.ConnectTimeout = time.Second * 10
	session, err := cluster.CreateSession()
	if err != nil {
		return Storage{}, errors.New("Cassandra Connection Error")
	}
	defer session.Close()

	// Migrations
	err = session.Query("CREATE KEYSPACE IF NOT EXISTS ohs_planner WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 1};").Exec()
	if err != nil {
		return Storage{}, errors.New("Error creating keyspace")
	}

	err = session.Query(`CREATE TABLE IF NOT EXISTS ohs_planner.activities (
		userId text,
		id UUID,
		planId UUID,
		summary text,
		stages text,
		dateTime timestamp,
		timeRelevant boolean,
		completed boolean,
		notes text,
		PRIMARY KEY ((userId), id)
	);`).Exec()

	if err != nil {
		return Storage{}, errors.New("Error creating activities table")
	}

	timeIndex := session.Query("CREATE INDEX IF NOT EXISTS ON ohs_planner.activities (dateTime);").Exec()
	planIndex := session.Query("CREATE INDEX IF NOT EXISTS ON ohs_planner.activities (planId);").Exec()

	if timeIndex != nil || planIndex != nil {
		return Storage{}, errors.New("Error creating activities indexes")
	}

	err = session.Query(`CREATE TABLE IF NOT EXISTS ohs_planner.plans (
		userId text,
		id UUID,
		name text,
		active boolean,
		PRIMARY KEY ((userId), id)
	);`).Exec()

	if err != nil {
		return Storage{}, errors.New("Error creating plans table")
	}

	return Storage{
		Activity: CassandraActivityStorage{Cluster: cluster},
		Plan:     CassandraPlanStorage{Cluster: cluster},
	}, nil
}
