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

func TestHappyPathCreateActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockActivityStorage(t)
	returnedActivity := storage.Activity{
		Id: uuid.New(),
	}
	mockStorage.EXPECT().Create(mock.Anything).Return(&returnedActivity, nil).Once()

	testUserId := "some-valid-expected-userid"

	createBody := `{
		"name": "some activity name"
	}`

	req, err := http.NewRequest("POST", "/my-endpoint", strings.NewReader(createBody))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerRoot(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, fmt.Sprintf(`"%s"`, returnedActivity.Id.String()), rr.Body.String())
}

func TestHappyPathUpdateActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.Activity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedActivity.Id).Return(&returnedActivity, nil).Once()

	mockStorage.EXPECT().Update(mock.Anything).Return(nil).Once()

	updateBody := `{
		"name": "some activity name update"
	}`
	// We have to use "real" query params here
	req, err := http.NewRequest("PUT", fmt.Sprintf("/api/activities/%s", returnedActivity.Id), strings.NewReader(updateBody))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerId(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestHappyPathDeleteActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.Activity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedActivity.Id).Return(&returnedActivity, nil).Once()

	mockStorage.EXPECT().Delete(returnedActivity.Id).Return(nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("DELETE", fmt.Sprintf("/api/activities/%s", returnedActivity.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerId(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, `{ "status": "ok" }`, rr.Body.String())
}

func TestMalformedReturns400CreateActivityHandler(t *testing.T) {

	mockStorage := storage.NewMockActivityStorage(t)

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

	handler := http.Handler(registerRoot(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestHappyPathReadActivityHandler(t *testing.T) {
	mockStorage := storage.NewMockActivityStorage(t)
	testUserId := "some-valid-expected-userid"

	returnedActivity := storage.Activity{
		Id:     uuid.New(),
		UserId: testUserId,
	}
	mockStorage.EXPECT().Read(returnedActivity.Id).Return(&returnedActivity, nil).Once()

	// We have to use "real" query params here
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/activities/%s", returnedActivity.Id), nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	rr.Header().Set(middlewares.VALIDATED_HEADER, testUserId)

	handler := http.Handler(registerId(mockStorage))
	handler.ServeHTTP(rr, req)

	expectedBody, err := json.Marshal(returnedActivity)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, string(expectedBody), rr.Body.String())
}
