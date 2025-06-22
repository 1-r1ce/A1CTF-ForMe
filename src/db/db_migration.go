package db

import (
	dbtool "a1ctf/src/utils/db_tool"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/pressly/goose/v3"
)

func getDBVersion(db *sql.DB) (int, error) {
	var dbVersion int
	err := db.QueryRow("SELECT version_id FROM goose_migrations ORDER BY version_id DESC LIMIT 1").Scan(&dbVersion)
	if err != nil {
		return -1, fmt.Errorf("failed to get DB version: %v", err)
	}
	return dbVersion, nil

}

var migrationsDir = "./migrations"
var migrationTableName = "goose_migrations"

func InitDB() {
	db, err := dbtool.DB().DB()
	if err != nil {
		log.Fatalf("goose: failed to open DB: %v", err)
	}

	goose.SetTableName(migrationTableName)

	version, err := getDBVersion(db)
	if err != nil {
		log.Printf("Init DB.................")
		goose.Up(db, migrationsDir)
		return
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Panic(err)
		return
	}

	maxVersion := 0

	for _, file := range files {
		if !file.IsDir() {
			fileName := file.Name()
			if strings.HasSuffix(fileName, ".sql") {
				versionStr := strings.Split(fileName, "_")[0]
				version, err := strconv.Atoi(versionStr)
				if err == nil {
					maxVersion = max(maxVersion, version)
				}
			}
		}
	}

	log.Printf("DB version: %d, max version: %d", version, maxVersion)

	if version < maxVersion {
		log.Printf("Starting migration from version %d to %d", version, maxVersion)
		goose.Up(db, migrationsDir)
	}

}
