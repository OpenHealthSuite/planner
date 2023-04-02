package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequiresUserIdHeaderHappyPathClearsHeaderAndSetsWithChecked(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, world!"))
	})

	middleware := RequiresUserIdHeader("x-planner-userid")
	finalHandler := middleware(handler)

	req := httptest.NewRequest("GET", "http://example.com/foo", nil)
	req.Header.Set("x-planner-userid", "test-user-id-123")
	req.Header.Set(VALIDATED_HEADER, "ERR_ALL_GONE_WRONG")

	rr := httptest.NewRecorder()

	finalHandler.ServeHTTP(rr, req)

	expectedHeader := "test-user-id-123"
	actualHeader := rr.Header().Get(VALIDATED_HEADER)
	if actualHeader != expectedHeader {
		t.Errorf("Expected header %s, but got %s", expectedHeader, actualHeader)
	}

	expectedBody := "Hello, world!"
	actualBody := rr.Body.String()
	if actualBody != expectedBody {
		t.Errorf("Expected body %s, but got %s", expectedBody, actualBody)
	}
}

func TestRequiresUserIdHeaderNoHeaderReturnsUnauthorised(t *testing.T) {
	handlerBody := "Hello, world!"
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(handlerBody))
	})

	middleware := RequiresUserIdHeader("x-planner-userid")
	finalHandler := middleware(handler)

	req := httptest.NewRequest("GET", "http://example.com/foo", nil)
	req.Header.Set(VALIDATED_HEADER, "ERR_ALL_GONE_WRONG")

	rr := httptest.NewRecorder()

	finalHandler.ServeHTTP(rr, req)

	statusCode := rr.Result().StatusCode
	expectedStatusCode := 401
	if statusCode != expectedStatusCode {
		t.Errorf("Expected statusCode to be %d, but got %d", expectedStatusCode, statusCode)
	}

	actualBody := rr.Body.String()
	if actualBody == handlerBody {
		t.Errorf("Expected body not to be %s, but got %s", handlerBody, actualBody)
	}
}
