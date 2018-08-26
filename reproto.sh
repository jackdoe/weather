
#protoc  --go_out=plugins=grpc:spec spec.proto

GOPATH=${GOPATH:-$HOME/go}
PATH=$PATH:$GOPATH/bin
if [ ! -d spec/ ];then
    mkdir spec/
fi


protoc -I/usr/local/include -I. \
  -I$GOPATH/src \
  -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis \
  --gofast_out=plugins=grpc:spec \
  --grpc-gateway_out=logtostderr=true:spec \
  --swagger_out=logtostderr=true:spec \
  spec.proto
