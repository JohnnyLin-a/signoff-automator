package main

import (
	"fmt"
	"os"

	"github.com/johnnylin-a/signoff-automator/v2/pkg/signoffautomatoapi"
)

func main() {
	err := signoffautomatoapi.Init()
	if err != nil {
		fmt.Println("Error when initializing api",err.Error());
		os.Exit(1);
	}
	err = signoffautomatoapi.Execute()
	if err != nil {
		fmt.Println("Error when Executing api ",err.Error());
	}
	fmt.Println("Main execution done");
	if (signoffautomatoapi.IsDebug()) {
		signoffautomatoapi.ResetDebug();
	}
}
