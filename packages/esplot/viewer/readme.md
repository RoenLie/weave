Windows
```bash
go build -o dist/esplotv-win32.exe -ldflags="-H windowsgui" esplotv.go

set GOOS=darwin && set GOARCH=arm64 && go build -o dist/esplotv-arm64 esplotv.go
```

Macos
```bash
go build -o dist/esplotv-arm64 esplotv.go
```





Notes:

implement a ws hub for sending new graphs to the existing server.
https://github.com/gorilla/websocket/blob/main/examples/chat/hub.go