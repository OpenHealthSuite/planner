package middlewares

import (
	"net/http"
	"os"
)

type Middleware func(http.Handler) http.Handler

const VALIDATED_HEADER = "x-validated-planner-userid"

func RequiresUserIdHeader(headerName string) Middleware {
	return func(handler http.Handler) http.Handler {
		singleUserId := os.Getenv("PLANNER_SINGLE_USERID")
		if singleUserId != "" {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set(VALIDATED_HEADER, singleUserId)
				handler.ServeHTTP(w, r)
			})
		}
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headerValue := r.Header.Get(headerName)
			if headerValue == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			w.Header().Set(VALIDATED_HEADER, headerValue)
			handler.ServeHTTP(w, r)
		})
	}
}
