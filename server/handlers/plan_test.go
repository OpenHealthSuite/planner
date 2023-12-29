package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"planner/middlewares"
	"planner/storage"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestHappyPathCreatePlanHandler(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	returnedPlan := storage.Plan{
		Id: uuid.New(),
	}
	mockStorage.EXPECT().Create(mock.Anything).Return(returnedPlan, nil).Once()

	testUserId := "some-valid-expected-userid"

	createBody := `{
		"name": "some plan name",
		"active": false
	}`

	req, err := http.NewRequest("POST", "/my-endpoint", strings.NewReader(createBody))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanRoot(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, fmt.Sprintf(`"%s"`, returnedPlan.Id.String()), rr.Body.String())
}

func TestHappyPathUpdatePlanHandler(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	mockActStorage := storage.NewMockActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedPlan.Id).Return(&returnedPlan, nil).Once()

	mockStorage.EXPECT().Update(mock.Anything).Return(nil).Once()

	updateBody := `{
		"name": "some plan name update"
	}`
	// We have to use "real" query params here
	req, err := http.NewRequest("PUT", fmt.Sprintf("/api/plans/%s", returnedPlan.Id), strings.NewReader(updateBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage, mockActStorage, storage.NewMockRecurringActivityStorage(t)))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestHappyPathDeletePlanHandler(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	mockActStorage := storage.NewMockActivityStorage(t)
	mockRecActStorage := storage.NewMockRecurringActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedPlan.Id).Return(&returnedPlan, nil).Once()

	mockStorage.EXPECT().Delete(testUserId, returnedPlan.Id).Return(nil).Once()
	mockActStorage.EXPECT().DeleteForPlan(testUserId, returnedPlan.Id).Return(nil).Once()
	mockRecActStorage.EXPECT().DeleteForPlan(testUserId, returnedPlan.Id).Return(nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("DELETE", fmt.Sprintf("/api/plans/%s", returnedPlan.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage, mockActStorage, mockRecActStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestMalformedReturns400CreatePlanHandler(t *testing.T) {

	mockStorage := storage.NewMockPlanStorage(t)

	testUserId := "some-valid-expected-userid"

	createBody := `{
		"namasde": 123
	}`

	req, err := http.NewRequest("POST", "/my-endpoint", strings.NewReader(createBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanRoot(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestHappyPathReadPlanHandler(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	mockActStorage := storage.NewMockActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedPlan.Id).Return(&returnedPlan, nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/plans/%s", returnedPlan.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage, mockActStorage, storage.NewMockRecurringActivityStorage(t)))
	handler.ServeHTTP(rr, req)

	expectedBody, err := json.Marshal(returnedPlan)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, string(expectedBody), rr.Body.String())
}

func TestHappyPathClonePlanHandler_StartDateShift(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	mockActStorage := storage.NewMockActivityStorage(t)
	mockRecActStorage := storage.NewMockRecurringActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
		Name:   "Some Plan Name",
	}
	mockStorage.EXPECT().Read(testUserId, returnedPlan.Id).Return(&returnedPlan, nil).Once()

	actExpected := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
		Name:   "Cloned - Some Plan Name",
	}

	expectedInput := storage.Plan{
		UserId: testUserId,
		Name:   "Cloned - Some Plan Name",
	}

	mockStorage.EXPECT().Create(expectedInput).Return(actExpected, nil).Once()

	existingActs := []storage.Activity{
		{
			Summary:  "First",
			DateTime: time.Date(2023, 12, 10, 11, 30, 00, 00, &time.Location{}),
		},
		{
			Summary:  "Second",
			DateTime: time.Date(2023, 12, 13, 11, 30, 00, 00, &time.Location{}),
		},
	}

	mockActStorage.EXPECT().Query(storage.ActivityStorageQuery{
		UserId: testUserId,
		PlanId: &returnedPlan.Id,
	}).Return(&existingActs, nil)

	mockActStorage.EXPECT().Create(storage.Activity{
		Summary:  "First",
		PlanId:   &actExpected.Id,
		DateTime: time.Date(2023, 12, 12, 11, 30, 00, 00, &time.Location{}),
	}).Return(storage.Activity{}, nil).Times(1)
	mockActStorage.EXPECT().Create(storage.Activity{
		Summary:  "Second",
		PlanId:   &actExpected.Id,
		DateTime: time.Date(2023, 12, 15, 11, 30, 00, 00, &time.Location{}),
	}).Return(storage.Activity{}, nil).Times(1)

	cloneBody := fmt.Sprintf(`{
		"id": "%s",
		"newStartDateTime": "2023-12-12T11:30:00Z"
	}`, returnedPlan.Id.String())
	req, err := http.NewRequest("POST", "/api/plans/clone", strings.NewReader(cloneBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage, mockActStorage, mockRecActStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.NotEqual(t, actExpected.Id.String(), rr.Body.String())
}

func TestHappyPathClonePlanHandler_EndDateShift(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	mockActStorage := storage.NewMockActivityStorage(t)
	mockRecActStorage := storage.NewMockRecurringActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
		Name:   "Some Plan Name",
	}
	mockStorage.EXPECT().Read(testUserId, returnedPlan.Id).Return(&returnedPlan, nil).Once()

	actExpected := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
		Name:   "Cloned - Some Plan Name",
	}

	expectedInput := storage.Plan{
		UserId: testUserId,
		Name:   "Cloned - Some Plan Name",
	}

	mockStorage.EXPECT().Create(expectedInput).Return(actExpected, nil).Once()

	existingActs := []storage.Activity{
		{
			Summary:  "First",
			DateTime: time.Date(2023, 12, 10, 11, 30, 00, 00, &time.Location{}),
		},
		{
			Summary:  "Second",
			DateTime: time.Date(2023, 12, 13, 11, 30, 00, 00, &time.Location{}),
		},
	}

	mockActStorage.EXPECT().Query(storage.ActivityStorageQuery{
		UserId: testUserId,
		PlanId: &returnedPlan.Id,
	}).Return(&existingActs, nil)

	mockActStorage.EXPECT().Create(storage.Activity{
		Summary:  "First",
		PlanId:   &actExpected.Id,
		DateTime: time.Date(2023, 12, 9, 11, 30, 00, 00, &time.Location{}),
	}).Return(storage.Activity{}, nil).Times(1)
	mockActStorage.EXPECT().Create(storage.Activity{
		Summary:  "Second",
		PlanId:   &actExpected.Id,
		DateTime: time.Date(2023, 12, 12, 11, 30, 00, 00, &time.Location{}),
	}).Return(storage.Activity{}, nil).Times(1)

	cloneBody := fmt.Sprintf(`{
		"id": "%s",
		"newEndDateTime": "2023-12-12T11:30:00Z"
	}`, returnedPlan.Id.String())
	req, err := http.NewRequest("POST", "/api/plans/clone", strings.NewReader(cloneBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage, mockActStorage, mockRecActStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.NotEqual(t, actExpected.Id.String(), rr.Body.String())
}
