Windows
```bash
go build -o dist/esplotv-win32.exe -ldflags="-H windowsgui" esplotv.go

set GOOS=darwin && set GOARCH=arm64 && go build -o dist/esplotv-arm64 esplotv.go
```

Macos
```bash
go build -o dist/esplotv-arm64 esplotv.go
```