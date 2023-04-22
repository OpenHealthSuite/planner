package storage

import (
	"errors"

	"github.com/google/uuid"
)

type CassandraActivityStorage struct {
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
	return Storage{}, errors.New("Not Implemented")
}
