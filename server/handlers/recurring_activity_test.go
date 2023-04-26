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

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestHappyPathCreateRecurringRecurringActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)
	returnedActivity := storage.RecurringActivity{
		Id: uuid.New(),
	}
	mockStorage.EXPECT().Create(mock.Anything).Return(returnedActivity, nil).Once()

	testUserId := "some-valid-expected-userid"

	createBody := `{
		"summary": "some activity name"
	}`

	req, err := http.NewRequest("POST", "/my-endpoint", strings.NewReader(createBody))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRecurringActivityRoot(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, fmt.Sprintf(`"%s"`, returnedActivity.Id.String()), rr.Body.String())
}

func TestHappyPathUpdateRecurringActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.RecurringActivity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedActivity.Id).Return(&returnedActivity, nil).Once()

	mockStorage.EXPECT().Update(mock.Anything).Return(nil).Once()

	updateBody := `{
		"summary": "some activity name update"
	}`
	// We have to use "real" query params here
	req, err := http.NewRequest("PUT", fmt.Sprintf("/api/recurring_activities/%s", returnedActivity.Id), strings.NewReader(updateBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRecurringActivityId(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestHappyPathDeleteRecurringActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.RecurringActivity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedActivity.Id).Return(&returnedActivity, nil).Once()

	mockStorage.EXPECT().Delete(testUserId, returnedActivity.Id).Return(nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("DELETE", fmt.Sprintf("/api/recurring_activities/%s", returnedActivity.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRecurringActivityId(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestMalformedReturns400CreateRecurringActivityHandler(t *testing.T) {

	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)

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

	handler := http.Handler(registerRecurringActivityRoot(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestPlanDoesntExistReturns400CreateRecurringActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)

	testUserId := "some-valid-expected-userid"
	planId := uuid.New()

	mockPlanStorage.EXPECT().Read(testUserId, planId).Return(nil, nil).Once()

	createBody := fmt.Sprintf(`{
		"summary": "some summary",
		"planId": "%s"
	}`, planId)

	req, err := http.NewRequest("POST", "/my-endpoint", strings.NewReader(createBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRecurringActivityRoot(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestHappyPathReadRecurringActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockRecurringActivityStorage(t)
	mockPlanStorage := storage.NewMockPlanStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.RecurringActivity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(testUserId, returnedActivity.Id).Return(&returnedActivity, nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/recurring_activities/%s", returnedActivity.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRecurringActivityId(mockStorage, mockPlanStorage))
	handler.ServeHTTP(rr, req)

	expectedBody, err := json.Marshal(returnedActivity)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, string(expectedBody), rr.Body.String())
}
