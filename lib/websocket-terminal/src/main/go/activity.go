package main

import (
	"time"
	"log"
	"net/http"
	"os"
)

var active bool
var lastUpdateTime int64

func NotifyActivity() {
	t := time.Now().Unix()
	if t < (lastUpdateTime + threshold) {
		active = true
	} else {
		log.Print("Direct call\n")
		makeActivityRequest()
		lastUpdateTime = t
	}
}

func makeActivityRequest() {
	req, _ := http.NewRequest(http.MethodPut, os.Getenv("CHE_API_ENDPOINT") + "/activity/" + os.Getenv("CHE_WORKSPACE_ID"), nil)
	client := &http.Client{}
	_, err := client.Do(req)

	if err != nil {
		log.Printf("Failed to notify user activity in terminal: %s\n", err)
	}

}

func StartScheduledCheck() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for _ = range ticker.C {
		if active {
			makeActivityRequest()
			active = false
		}

		log.Print("Scheduled call\n")
	}
}