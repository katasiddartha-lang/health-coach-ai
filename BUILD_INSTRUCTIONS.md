# 📦 Health Coach AI - APK Build Instructions

## ✅ Project is Ready for EAS Build!

Your project has been configured with:
- ✅ Updated `app.json` with Android package name
- ✅ Created `eas.json` with build profiles
- ✅ Configured permissions for file access
- ✅ Set up app branding

---

## 🚀 Step-by-Step Instructions to Build APK

### **Step 1: Install EAS CLI**

Open your terminal/command prompt and run:

```bash
npm install -g eas-cli
```

Or if you use yarn:

```bash
yarn global add eas-cli
```

---

### **Step 2: Download Your Project**

You need to download the project from Emergent to your local machine.

**Option A: Clone from Git (if available)**
```bash
git clone <your-repo-url>
cd health-coach-ai
```

**Option B: Download the frontend folder**
- Download the `/app/frontend` folder from your Emergent workspace
- Extract it to your local machine
- Navigate to it in terminal

---

### **Step 3: Navigate to Frontend Folder**

```bash
cd /path/to/your/frontend
```

---

### **Step 4: Install Dependencies**

Make sure all packages are installed:

```bash
npm install
```

Or with yarn:

```bash
yarn install
```

---

### **Step 5: Login to EAS**

Create a free account at [expo.dev](https://expo.dev) if you haven't already, then:

```bash
eas login
```

Enter your Expo credentials when prompted.

---

### **Step 6: Configure EAS Project**

Run this command to link your project to EAS:

```bash
eas build:configure
```

This will:
- Create a project on Expo's servers
- Link it to your local project
- Update your app.json with project ID

---

### **Step 7: Build APK**

Now build your APK! Choose one option:

#### **Option A: Preview Build** (Recommended for testing)
```bash
eas build --platform android --profile preview
```

#### **Option B: Production Build** (For final release)
```bash
eas build --platform android --profile production
```

---

### **Step 8: Wait for Build**

- Build takes 10-20 minutes
- You'll see build progress in terminal
- You can close terminal - build continues on EAS servers
- Check status at: https://expo.dev/accounts/[your-account]/projects/health-coach-ai/builds

---

### **Step 9: Download APK**

When build completes:

1. You'll get a download link in terminal
2. Or visit: https://expo.dev → Projects → health-coach-ai → Builds
3. Click "Download" next to your build
4. Save the `.apk` file

---

### **Step 10: Install on Android Phone**

#### **Transfer APK to Phone:**
- Email it to yourself
- Use Google Drive / Dropbox
- Transfer via USB cable
- Send via messaging app

#### **Install APK:**
1. On your Android phone, go to **Settings**
2. Search for **"Install unknown apps"** or **"Unknown sources"**
3. Enable for the app you'll use to install (e.g., Chrome, Files)
4. Tap the APK file
5. Tap **"Install"**
6. Open **"Health Coach AI"** app!

---

## 🎯 Quick Command Reference

```bash
# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build APK (run every time you want new build)
eas build --platform android --profile preview

# Check build status
eas build:list

# View build logs (if build fails)
eas build:view
```

---

## 💰 Cost Information

- **FREE builds per month**: Limited (check current limits at expo.dev/pricing)
- **Paid plan**: Unlimited builds with EAS subscription
- **First few builds**: Usually FREE to test

---

## 🔧 Important Notes

### **Backend URL Configuration:**
Your app is currently configured to connect to:
```
https://health-coach-ai-22.preview.emergentagent.com/api
```

**⚠️ Important:** This URL works while your Emergent workspace is running. For a production app, you'll need to:

1. Deploy your backend to a permanent server (AWS, Heroku, DigitalOcean, etc.)
2. Update `EXPO_PUBLIC_BACKEND_URL` in `/app/frontend/.env`
3. Rebuild the APK

### **For Local Backend (Development):**
If you want to test with backend running on your computer:
1. Find your local IP address (e.g., 192.168.1.100)
2. Update `.env`: `EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001`
3. Make sure phone and computer are on same WiFi
4. Rebuild APK

---

## ❌ Troubleshooting

### **Error: "EXPO_PUBLIC_BACKEND_URL not defined"**
- Make sure `.env` file exists in frontend folder
- Contains: `EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com`

### **Error: "Build failed"**
- Check build logs: `eas build:view`
- Common issues:
  - Missing dependencies: Run `npm install` or `yarn install`
  - Outdated packages: Run `npm update` or `yarn upgrade`

### **Error: "No active subscription"**
- You've used up free builds
- Options:
  1. Wait for monthly reset
  2. Subscribe to EAS
  3. Build locally (see Alternative Method below)

---

## 🔄 Alternative: Local Build (Without EAS)

If you prefer to build locally without EAS:

### **Requirements:**
- Android Studio installed
- Java JDK 11+
- Android SDK

### **Commands:**
```bash
# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# Find APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 App Details

- **App Name:** Health Coach AI
- **Package Name:** com.healthcoach.ai
- **Version:** 1.0.0
- **Permissions:** Read/Write Storage (for PDF uploads)

---

## 🎉 What's Next?

After installing APK:

1. **Register** with your details
2. **Get Hugging Face API key** (free): https://huggingface.co/settings/tokens
3. **Upload lab report PDF** 
4. **Analyze with AI** (enter HF API key)
5. **Fill daily questionnaire**
6. **Generate workout plan**

---

## 📞 Need Help?

Common issues:
- **APK not installing:** Enable "Install from unknown sources"
- **Build taking too long:** Normal for first build (15-20 min)
- **Build failed:** Check logs with `eas build:view`
- **Backend not connecting:** Verify backend URL in .env file

---

## ✨ Summary

Your project is **100% ready** for EAS Build!

**Fastest path:**
```bash
npm install -g eas-cli
eas login
cd /path/to/frontend
eas build --platform android --profile preview
# Wait → Download → Install → Enjoy! 🎉
```

---

**Good luck building your Health Coach AI app! 🚀💪**
