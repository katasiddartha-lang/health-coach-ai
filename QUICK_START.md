# 🚀 QUICK START - Build APK in 5 Minutes

## ✅ Your project is READY! Just follow these commands:

### 1️⃣ Install EAS CLI (One-time)
```bash
npm install -g eas-cli
```

### 2️⃣ Login to Expo (One-time)
```bash
eas login
```
*(Create free account at expo.dev if needed)*

### 3️⃣ Navigate to Your Project
```bash
cd /path/to/your/frontend
```

### 4️⃣ Install Dependencies (First time)
```bash
npm install
```

### 5️⃣ Configure EAS (First time)
```bash
eas build:configure
```

### 6️⃣ Build APK! 🎉
```bash
eas build --platform android --profile preview
```

### 7️⃣ Wait 15-20 minutes → Download APK → Install on phone!

---

## 📱 Install APK on Phone:

1. **Enable "Install from unknown sources"** in Android settings
2. **Transfer APK** to phone (email/drive/USB)
3. **Tap APK file** → Install
4. **Open "Health Coach AI"** app!

---

## ⚙️ What Was Configured:

✅ `app.json` - App metadata & Android settings
✅ `eas.json` - Build profiles  
✅ Package name: `com.healthcoach.ai`
✅ Permissions: File storage access
✅ All plugins configured

---

## 📝 Files to Check:

- `/app/frontend/app.json` - Main config
- `/app/frontend/eas.json` - Build settings
- `/app/frontend/.env` - Backend URL
- `/app/BUILD_INSTRUCTIONS.md` - Full detailed guide

---

## 🎯 Quick Commands:

```bash
# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production APK (final version)
eas build --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view
```

---

## 💰 Free Tier:

- Limited free builds per month
- Check: expo.dev/pricing
- First few builds usually FREE

---

## 🔗 Important Links:

- **Expo Dashboard**: https://expo.dev
- **Create Account**: https://expo.dev/signup
- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Pricing**: https://expo.dev/pricing

---

## ⚠️ Backend URL Note:

Your app connects to:
```
https://health-coach-ai-22.preview.emergentagent.com/api
```

This works while Emergent workspace is running. For permanent deployment, deploy backend separately and update `.env` file.

---

## 🆘 Troubleshooting:

**Build failed?**
```bash
eas build:view  # See detailed logs
```

**Need to rebuild?**
```bash
eas build --platform android --profile preview --clear-cache
```

**APK won't install?**
- Enable "Install from unknown sources" in Android
- Try different transfer method

---

## ✨ That's it! You're ready to build! 🚀

Run this and you're done:
```bash
npm install -g eas-cli && eas login && cd /path/to/frontend && eas build --platform android --profile preview
```

---

**Questions?** Check `/app/BUILD_INSTRUCTIONS.md` for full details!
