package middlewares

import (
	"net/http"
)

type middleware func(http.Handler) http.Handler

const VALIDATED_HEADER = "x-validated-planner-userid"

func RequiresUserIdHeader(headerName string) middleware {
	return func(handler http.Handler) http.Handler {
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
