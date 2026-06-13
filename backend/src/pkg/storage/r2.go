// Package storage handles persistent file uploads. Local disk is the dev
// fallback; in production we use Cloudflare R2 because Render's filesystem
// is wiped on every container restart (free tier).
package storage

import (
	"context"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/wealthy-prime/backend/src/config"
)

var (
	r2ClientOnce sync.Once
	r2Client     *minio.Client
	r2InitErr    error
)

// R2 lazily builds an R2 client from config. Returns nil + error if R2 is
// not configured — callers should fall back to local disk in that case.
func R2() (*minio.Client, error) {
	cfg := config.App.R2
	if !cfg.Enabled() {
		return nil, fmt.Errorf("r2 not configured")
	}
	r2ClientOnce.Do(func() {
		endpoint := cfg.AccountID + ".r2.cloudflarestorage.com"
		r2Client, r2InitErr = minio.New(endpoint, &minio.Options{
			Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
			Secure: true,
			Region: "auto",
		})
	})
	return r2Client, r2InitErr
}

// UploadToR2 streams the reader's bytes to the configured bucket under
// objectName and returns a public URL (PublicURL/objectName). The caller
// must provide an accurate contentType so browsers render images inline
// instead of triggering a download.
func UploadToR2(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	client, err := R2()
	if err != nil {
		return "", err
	}
	cfg := config.App.R2
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	_, err = client.PutObject(ctx, cfg.Bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("r2 put %s: %w", objectName, err)
	}
	return cfg.PublicURL + "/" + objectName, nil
}
