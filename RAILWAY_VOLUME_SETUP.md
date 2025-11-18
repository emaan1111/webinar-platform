# Railway Volume Setup for Image Uploads

## ✅ Image Storage Now Uses Filesystem

Images are stored in files (not database) for better performance.

## 📁 Storage Location

- **Railway (Production)**: `/data/uploads` (persistent volume)
- **Local Development**: `public/uploads` (in project folder)

## 🔧 Railway Volume Configuration

**You MUST add a volume in Railway for images to persist:**

### Steps:

1. Go to https://railway.app
2. Select your project: **brilliant-charm**
3. Click on **webinar-platform** service
4. Go to **Volumes** tab
5. Click **"New Volume"**
6. Configure:
   - **Mount Path**: `/data/uploads`
   - **Size**: 1GB (or more if needed)
7. Click **"Add Volume"**
8. Railway will restart your service automatically

## 🎯 How It Works

### Upload Process:
1. User uploads image via dashboard
2. Image saved to `/data/uploads/1234567890-xyz.png`
3. Database stores: `{ url: "/api/images/serve/1234567890-xyz.png", ... }`
4. When displaying: API route `/api/images/serve/[filename]` serves the file

### API Routes:
- `POST /api/images` - Upload new image
- `GET /api/images` - List all images
- `GET /api/images/serve/[filename]` - Serve image file
- `DELETE /api/images/[id]` - Delete image

## ✅ Benefits

1. **Persistent Storage** - Images survive deployments (with volume)
2. **Better Performance** - No base64 encoding/decoding
3. **Larger Files** - Can handle 10MB+ images
4. **Standard Practice** - Industry standard approach

## 🧪 Testing

### Local:
```bash
# Images stored in: public/uploads/
# Access at: http://localhost:3001/uploads/filename.png
```

### Railway (after adding volume):
```bash
# Images stored in: /data/uploads/ (persistent volume)
# Access at: https://your-app.railway.app/api/images/serve/filename.png
```

## ⚠️ Important

**Without the volume**, images will be lost on each deployment because Railway's filesystem is ephemeral.

**With the volume**, images persist forever (or until volume is deleted).

## 📊 Current Status

- ✅ Code deployed
- ⚠️ **Volume not yet added** - You need to add it manually
- ✅ Local development works with public/uploads

## 🚀 Next Steps

1. Add volume in Railway dashboard (see steps above)
2. Test image upload at: https://webinar-platform-production.up.railway.app/dashboard/images
3. Images will persist across deployments!

---

**Deployment**: Automatic via GitHub push
**Last Updated**: November 19, 2025
