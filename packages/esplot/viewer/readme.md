Windows
```bash
go build -o ../core/bin/esplotv-win32.exe -ldflags="-H windowsgui" .
```

Macos
```bash
go build -o ../core/bin/esplotv-arm64 .
```





Notes:

implement a ws hub for sending new graphs to the existing server.
https://github.com/gorilla/websocket/blob/main/examples/chat/hub.go