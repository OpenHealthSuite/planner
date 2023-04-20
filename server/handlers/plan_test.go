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
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedPlan.Id).Return(&returnedPlan, nil).Once()

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

	handler := http.Handler(registerPlanId(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestHappyPathDeletePlanHandler(t *testing.T) {
	mockStorage := storage.NewMockPlanStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedPlan.Id).Return(&returnedPlan, nil).Once()

	mockStorage.EXPECT().Delete(returnedPlan.Id).Return(nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("DELETE", fmt.Sprintf("/api/plans/%s", returnedPlan.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage))
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
	testUserId := "some-valid-expected-userid"

	returnedPlan := storage.Plan{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedPlan.Id).Return(&returnedPlan, nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/plans/%s", returnedPlan.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerPlanId(mockStorage))
	handler.ServeHTTP(rr, req)

	expectedBody, err := json.Marshal(returnedPlan)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, string(expectedBody), rr.Body.String())
}
