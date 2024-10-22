Windows
```bash
go build -o dist/esplotv-win32.exe -ldflags="-H windowsgui" .

set GOOS=darwin && set GOARCH=arm64 && go build -o dist/esplotv-arm64 main.go
```

Macos
```bash
go build -o dist/esplotv-arm64 esplotv.go
```





Notes:

implement a ws hub for sending new graphs to the existing server.
https://github.com/gorilla/websocket/blob/main/examples/chat/hub.go