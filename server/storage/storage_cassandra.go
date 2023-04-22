package storage

import (
	"errors"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"
)

type CassandraActivityStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraActivityStorage) Create(activity Activity) (Activity, error) {
	return Activity{}, errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Read(id uuid.UUID) (*Activity, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Update(activity Activity) error {
	return errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) Delete(id uuid.UUID) error {
	return errors.New("Not Implemented")
}

func (stg CassandraActivityStorage) DeleteForPlan(id uuid.UUID) error {
	return errors.New("Not Implemented")
}

type CassandraPlanStorage struct {
	Cluster *gocql.ClusterConfig
}

func (stg CassandraPlanStorage) Create(plan Plan) (Plan, error) {
	return Plan{}, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Read(id uuid.UUID) (*Plan, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Query(query PlanStorageQuery) (*[]Plan, error) {
	return nil, errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Update(plan Plan) error {
	return errors.New("Not Implemented")
}

func (stg CassandraPlanStorage) Delete(id uuid.UUID) error {
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
