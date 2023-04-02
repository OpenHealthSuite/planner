package handlers

import (
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
	req.Header.Set(middlewares.VALIDATED_HEADER, testUserId)

	rr := httptest.NewRecorder()

	handler := http.Handler(generateCreateActivityHandler(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, fmt.Sprintf(`"%s"`, returnedActivity.Id.String()), rr.Body.String())
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
	req.Header.Set(middlewares.VALIDATED_HEADER, testUserId)

	rr := httptest.NewRecorder()

	handler := http.Handler(generateCreateActivityHandler(mockStorage))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}
