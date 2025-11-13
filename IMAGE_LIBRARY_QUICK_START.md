# 📸 Image Library - Quick Start

## ✅ What's Ready

A complete image management system has been set up for you! You can now:
- Upload images via drag-and-drop
- Copy URLs to use in your pages
- Search and organize your images
- Delete images you don't need

## 🚀 Access Your Image Library

1. **Open your dashboard**: http://localhost:3000/dashboard
2. **Click "Images"** in the sidebar (look for the 🖼️ icon)
3. **Start uploading!**

## 📤 How to Upload

### Drag & Drop:
1. Drag any image file from your computer
2. Drop it onto the upload area
3. Done! Image appears in your library

### Or Click to Browse:
1. Click the "Choose File" button
2. Select an image
3. It uploads automatically

**Supported**: JPG, PNG, GIF, WebP, SVG (max 10MB)

## 🔗 How to Use Images in Your Pages

### Step 1: Upload Your Image
Upload through the Image Library page

### Step 2: Copy the URL
Click the "Copy URL" button on your image

### Step 3: Paste in Your Template
```html
<!-- Example: In a thank you page template -->
<img src="http://localhost:3000/uploads/your-image.jpg" alt="Bonus Gift" />

<!-- Example: As a background -->
<div style="background-image: url('http://localhost:3000/uploads/hero-bg.jpg');">
  <!-- Your content -->
</div>

<!-- Example: Host profile picture -->
<img src="http://localhost:3000/uploads/host-photo.jpg" 
     style="border-radius: 50%; width: 100px;" 
     alt="Your Host" />
```

## 🎯 Common Use Cases

### 1. **Registration Page Hero Images**
- Upload your hero image
- Copy the URL
- Edit your registration page HTML
- Add: `<img src="YOUR_URL" />`

### 2. **Thank You Page Bonus Images**
- Upload image of your bonus/ebook
- Copy URL
- Add to thank you page template
- Shows bonus visually to registrants

### 3. **Countdown Page Backgrounds**
- Upload background pattern/image
- Copy URL
- Set as body or section background in countdown page

### 4. **Host Profile Pictures**
- Upload your photo
- Copy URL
- Add to registration/countdown pages
- Builds trust with attendees

## 🏷️ Stay Organized

**Add Tags**: Click edit icon → add tags like "hero, background, webinar1"
**Add Description**: Describe what the image is for
**Search**: Use the search bar to find images by name, tags, or description

## 📁 Where Are Images Stored?

- **On Disk**: `/public/uploads/` folder
- **In Database**: Metadata tracked in `images` table
- **URL Format**: `http://localhost:3000/uploads/filename.jpg`

## ⚠️ Important Notes

1. **Delete Carefully**: Once deleted, images are gone permanently
2. **Check Usage**: Before deleting, make sure no pages are using that image
3. **File Size**: Keep images under 10MB
4. **Optimization**: Compress large images before uploading for faster page loads

## 🎨 Pro Tips

✅ **Name files descriptively** before uploading (easier to find later)
✅ **Use tags** to group related images
✅ **Test the URL** in a template before using widely
✅ **Keep backups** of important images elsewhere
✅ **Optimize images** for web (use tools like TinyPNG) before uploading

## 🆘 Need Help?

**Can't upload?**
- Check file size (< 10MB)
- Ensure it's an image file type
- Try a different browser

**Image not showing?**
- Verify the URL was copied correctly
- Check browser console for errors
- Refresh the page

**Can't delete?**
- Make sure you're logged in as ADMIN or HOST
- Check if image is being used in a template

## 🎉 You're Ready!

Your image library is fully set up and ready to use. Start uploading images and enhance your webinar pages with professional visuals!

**Quick Access**: Dashboard → Images → Upload → Copy URL → Use in Pages

Happy creating! 🚀
