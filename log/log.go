package log

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"os"
	"path"
)

var zapLogger *zap.Logger
var log *zap.SugaredLogger

func CreateLogger(root string) {
	rotator := &lumberjack.Logger{
		Filename:   path.Join(root, "service.log"),
		MaxSize:    10, // megabytes
		MaxBackups: 2,
		Compress:   true,
	}

	logWriter := zap.CombineWriteSyncers(os.Stdout, zapcore.AddSync(rotator))
	zapCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
		logWriter,
		zapcore.InfoLevel,
	)
	zapLogger = zap.New(zapCore)
	log = zapLogger.Sugar()
}

func Log() *zap.SugaredLogger {
	return log
}

func Zap() *zap.Logger {
	return zapLogger}
