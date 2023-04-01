package storage

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type Sqlite3ActivityStorage struct {
	DB *sql.DB
}

func (stg Sqlite3ActivityStorage) Create(id Activity) (*Activity, error) {
	return nil, errors.New("Not implemented")
}

func (stg Sqlite3ActivityStorage) Read(id uuid.UUID) (*Activity, error) {
	selectSQL := `
			SELECT 
				id,
				userId,
				name,
				type,
				attributes,
				details,
				dateTime,
				timeRelevant,
				durationMinutes,
				completed
			FROM activities 
			WHERE id = ?;
	`
	rows, err := stg.DB.Query(selectSQL, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Print the results of the query
	if rows.Next() {
		var activity Activity
		rawAttributes := "{}"
		err = rows.Scan(
			activity.Id,
			activity.UserId,
			activity.Name,
			activity.Type,
			rawAttributes,
			activity.Details,
			activity.DateTime,
			activity.TimeRelevant,
			activity.DurationMinutes,
			activity.Completed,
		)
		if err != nil {
			return nil, err
		}
		err := json.Unmarshal([]byte(rawAttributes), &activity.Attributes)
		if err != nil {
			return nil, err
		}
		return &activity, nil
	}
	return nil, nil
}

func (stg Sqlite3ActivityStorage) Query(query ActivityStorageQuery) (*[]Activity, error) {
	return nil, errors.New("Not implemented")
}

func (stg Sqlite3ActivityStorage) Update(activity Activity) error {
	return errors.New("Not implemented")
}

func (stg Sqlite3ActivityStorage) Delete(id uuid.UUID) error {
	return errors.New("Not implemented")
}

func getSqliteStorageClient(filepath string) (ActivityStorage, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}
	// Do migrations
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS activities (
			id TEXT PRIMARY KEY,
			userId TEXT,
			name TEXT,
			type TEXT,
			attributes TEXT,
			details TEXT NULL,
			dateTime DATETIME,
			timeRelevant BOOLEAN,
			durationMinutes INTEGER NULL,
			completed BOOLEAN
	);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}
	strg := Sqlite3ActivityStorage{DB: db}
	return strg, nil
}

func main() {
	// Open an in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer db.Close()

	// Create a table in the database
	createTableSQL := `
			CREATE TABLE users (
					id INTEGER PRIMARY KEY,
					name TEXT,
					age INTEGER
			);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Insert some data into the table
	insertSQL := `
			INSERT INTO users (name, age)
			VALUES (?, ?);
	`
	_, err = db.Exec(insertSQL, "Alice", 28)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = db.Exec(insertSQL, "Bob", 35)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Query the data from the table
	selectSQL := `
			SELECT * FROM users;
	`
	rows, err := db.Query(selectSQL)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer rows.Close()

	// Print the results of the query
	fmt.Println("Users:")
	for rows.Next() {
		var id int
		var name string
		var age int
		err = rows.Scan(&id, &name, &age)
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Printf("%d: %s (%d)\n", id, name, age)
	}
}
