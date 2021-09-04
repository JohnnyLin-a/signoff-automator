package main

import (
	"log"
	"os"

	"github.com/johnnylin-a/signoff-automator/v2/pkg/signoffautomatoapi"
)

func main() {
	err := signoffautomatoapi.Init()
	if err != nil {
		log.Println("Error when initializing api", err.Error())
		os.Exit(1)
	}
	err = signoffautomatoapi.Execute()
	if err != nil {
		log.Println("Error when Executing api ", err.Error())
	}
	log.Println("Main execution done")
	if signoffautomatoapi.IsDebug() {
		signoffautomatoapi.ResetDebug()
	}
}
