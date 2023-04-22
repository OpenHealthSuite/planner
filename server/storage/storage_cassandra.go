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
	insertErr := session.Query(insertCQL,
		newId,
		activity.UserId,
		activity.PlanId,
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
	return activity, errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Read(userId string, id uuid.UUID) (*Activity, error) {
	return nil, errors.New("Not Implemented")
	// var id gocql.UUID
	// var text string

	// /* Search for a specific set of records whose 'timeline' column matches
	//  * the value 'me'. The secondary index that we created earlier will be
	//  * used for optimizing the search */
	// if err := session.Query(`SELECT id, text FROM tweet WHERE timeline = ? LIMIT 1`,
	// 	"me").WithContext(ctx).Consistency(gocql.One).Scan(&id, &text); err != nil {
	// 	log.Fatal(err)
	// }
	// fmt.Println("Tweet:", id, text)
	// fmt.Println()
}

func (stg CassandraActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
	return nil, errors.New("Not Implemented")
	//	scanner := session.Query(`SELECT id, text FROM tweet WHERE timeline = ?`,
	//	"me").WithContext(ctx).Iter().Scanner()
	//
	//	for scanner.Next() {
	//		err = scanner.Scan(&id, &text)
	//		if err != nil {
	//			log.Fatal(err)
	//		}
	//		fmt.Println("Tweet:", id, text)
	//	}
}

func (stg CassandraActivityStorage) Update(activity Activity) error {
	return errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Delete(userId string, id uuid.UUID) error {
	return errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) DeleteForPlan(userId string, id uuid.UUID) error {
	return errors.New("Not Implemented")
}

type CassandraPlanStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraPlanStorage) Create(plan Plan) (Plan, error) {
	return Plan{}, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Read(userId string, id uuid.UUID) (*Plan, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Query(query PlanStorageQuery) (*[]Plan, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Update(plan Plan) error {
	return errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Delete(userId string, id uuid.UUID) error {
	return errors.New("Not Implemented")
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
	err = session.Query("CREATE KEYSPACE IF NOT EXISTS ohs_planner WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 3};").Exec()
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
