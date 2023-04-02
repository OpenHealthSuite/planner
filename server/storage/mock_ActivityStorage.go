// Code generated by mockery v2.23.1. DO NOT EDIT.

package storage

import (
	uuid "github.com/google/uuid"
	mock "github.com/stretchr/testify/mock"
)

// MockActivityStorage is an autogenerated mock type for the ActivityStorage type
type MockActivityStorage struct {
	mock.Mock
}

type MockActivityStorage_Expecter struct {
	mock *mock.Mock
}

func (_m *MockActivityStorage) EXPECT() *MockActivityStorage_Expecter {
	return &MockActivityStorage_Expecter{mock: &_m.Mock}
}

// Create provides a mock function with given fields: activity
func (_m *MockActivityStorage) Create(activity Activity) (*Activity, error) {
	ret := _m.Called(activity)

	var r0 *Activity
	var r1 error
	if rf, ok := ret.Get(0).(func(Activity) (*Activity, error)); ok {
		return rf(activity)
	}
	if rf, ok := ret.Get(0).(func(Activity) *Activity); ok {
		r0 = rf(activity)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*Activity)
		}
	}

	if rf, ok := ret.Get(1).(func(Activity) error); ok {
		r1 = rf(activity)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// MockActivityStorage_Create_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Create'
type MockActivityStorage_Create_Call struct {
	*mock.Call
}

// Create is a helper method to define mock.On call
//   - activity Activity
func (_e *MockActivityStorage_Expecter) Create(activity interface{}) *MockActivityStorage_Create_Call {
	return &MockActivityStorage_Create_Call{Call: _e.mock.On("Create", activity)}
}

func (_c *MockActivityStorage_Create_Call) Run(run func(activity Activity)) *MockActivityStorage_Create_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(Activity))
	})
	return _c
}

func (_c *MockActivityStorage_Create_Call) Return(_a0 *Activity, _a1 error) *MockActivityStorage_Create_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *MockActivityStorage_Create_Call) RunAndReturn(run func(Activity) (*Activity, error)) *MockActivityStorage_Create_Call {
	_c.Call.Return(run)
	return _c
}

// Delete provides a mock function with given fields: id
func (_m *MockActivityStorage) Delete(id uuid.UUID) error {
	ret := _m.Called(id)

	var r0 error
	if rf, ok := ret.Get(0).(func(uuid.UUID) error); ok {
		r0 = rf(id)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// MockActivityStorage_Delete_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Delete'
type MockActivityStorage_Delete_Call struct {
	*mock.Call
}

// Delete is a helper method to define mock.On call
//   - id uuid.UUID
func (_e *MockActivityStorage_Expecter) Delete(id interface{}) *MockActivityStorage_Delete_Call {
	return &MockActivityStorage_Delete_Call{Call: _e.mock.On("Delete", id)}
}

func (_c *MockActivityStorage_Delete_Call) Run(run func(id uuid.UUID)) *MockActivityStorage_Delete_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(uuid.UUID))
	})
	return _c
}

func (_c *MockActivityStorage_Delete_Call) Return(_a0 error) *MockActivityStorage_Delete_Call {
	_c.Call.Return(_a0)
	return _c
}

func (_c *MockActivityStorage_Delete_Call) RunAndReturn(run func(uuid.UUID) error) *MockActivityStorage_Delete_Call {
	_c.Call.Return(run)
	return _c
}

// Query provides a mock function with given fields: query
func (_m *MockActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
	ret := _m.Called(query)

	var r0 *[]Activity
	var r1 error
	if rf, ok := ret.Get(0).(func(ActivityStorageQuery) (*[]Activity, error)); ok {
		return rf(query)
	}
	if rf, ok := ret.Get(0).(func(ActivityStorageQuery) *[]Activity); ok {
		r0 = rf(query)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*[]Activity)
		}
	}

	if rf, ok := ret.Get(1).(func(ActivityStorageQuery) error); ok {
		r1 = rf(query)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// MockActivityStorage_Query_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Query'
type MockActivityStorage_Query_Call struct {
	*mock.Call
}

// Query is a helper method to define mock.On call
//   - query ActivityStorageQuery
func (_e *MockActivityStorage_Expecter) Query(query interface{}) *MockActivityStorage_Query_Call {
	return &MockActivityStorage_Query_Call{Call: _e.mock.On("Query", query)}
}

func (_c *MockActivityStorage_Query_Call) Run(run func(query ActivityStorageQuery)) *MockActivityStorage_Query_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(ActivityStorageQuery))
	})
	return _c
}

func (_c *MockActivityStorage_Query_Call) Return(_a0 *[]Activity, _a1 error) *MockActivityStorage_Query_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *MockActivityStorage_Query_Call) RunAndReturn(run func(ActivityStorageQuery) (*[]Activity, error)) *MockActivityStorage_Query_Call {
	_c.Call.Return(run)
	return _c
}

// Read provides a mock function with given fields: id
func (_m *MockActivityStorage) Read(id uuid.UUID) (*Activity, error) {
	ret := _m.Called(id)

	var r0 *Activity
	var r1 error
	if rf, ok := ret.Get(0).(func(uuid.UUID) (*Activity, error)); ok {
		return rf(id)
	}
	if rf, ok := ret.Get(0).(func(uuid.UUID) *Activity); ok {
		r0 = rf(id)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*Activity)
		}
	}

	if rf, ok := ret.Get(1).(func(uuid.UUID) error); ok {
		r1 = rf(id)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// MockActivityStorage_Read_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Read'
type MockActivityStorage_Read_Call struct {
	*mock.Call
}

// Read is a helper method to define mock.On call
//   - id uuid.UUID
func (_e *MockActivityStorage_Expecter) Read(id interface{}) *MockActivityStorage_Read_Call {
	return &MockActivityStorage_Read_Call{Call: _e.mock.On("Read", id)}
}

func (_c *MockActivityStorage_Read_Call) Run(run func(id uuid.UUID)) *MockActivityStorage_Read_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(uuid.UUID))
	})
	return _c
}

func (_c *MockActivityStorage_Read_Call) Return(_a0 *Activity, _a1 error) *MockActivityStorage_Read_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *MockActivityStorage_Read_Call) RunAndReturn(run func(uuid.UUID) (*Activity, error)) *MockActivityStorage_Read_Call {
	_c.Call.Return(run)
	return _c
}

// Update provides a mock function with given fields: activity
func (_m *MockActivityStorage) Update(activity Activity) error {
	ret := _m.Called(activity)

	var r0 error
	if rf, ok := ret.Get(0).(func(Activity) error); ok {
		r0 = rf(activity)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// MockActivityStorage_Update_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Update'
type MockActivityStorage_Update_Call struct {
	*mock.Call
}

// Update is a helper method to define mock.On call
//   - activity Activity
func (_e *MockActivityStorage_Expecter) Update(activity interface{}) *MockActivityStorage_Update_Call {
	return &MockActivityStorage_Update_Call{Call: _e.mock.On("Update", activity)}
}

func (_c *MockActivityStorage_Update_Call) Run(run func(activity Activity)) *MockActivityStorage_Update_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(Activity))
	})
	return _c
}

func (_c *MockActivityStorage_Update_Call) Return(_a0 error) *MockActivityStorage_Update_Call {
	_c.Call.Return(_a0)
	return _c
}

func (_c *MockActivityStorage_Update_Call) RunAndReturn(run func(Activity) error) *MockActivityStorage_Update_Call {
	_c.Call.Return(run)
	return _c
}

type mockConstructorTestingTNewMockActivityStorage interface {
	mock.TestingT
	Cleanup(func())
}

// NewMockActivityStorage creates a new instance of MockActivityStorage. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
func NewMockActivityStorage(t mockConstructorTestingTNewMockActivityStorage) *MockActivityStorage {
	mock := &MockActivityStorage{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
