import { readFile, writeFile } from "node:fs/promises";

const androidManifestPath = "android/app/src/main/AndroidManifest.xml";
const iosInfoPlistPath = "ios/App/App/Info.plist";

const androidManifest = await readFile(androidManifestPath, "utf8");
if (!androidManifest.includes('android:scheme="com.arownd.app"')) {
  const activityMatch = androidManifest.match(/<activity\b[^>]*>/);
  const activityStart = activityMatch?.index ?? -1;
  const activityEnd = androidManifest.indexOf("</activity>", activityStart);
  if (!activityMatch || activityStart < 0 || activityEnd < 0) {
    throw new Error("Could not locate the Android MainActivity in AndroidManifest.xml");
  }

  const activityTag = activityMatch[0].includes("android:launchMode=")
    ? activityMatch[0]
    : activityMatch[0].replace(/>$/, ' android:launchMode="singleTask">');
  const manifestWithLaunchMode =
    androidManifest.slice(0, activityStart) +
    activityTag +
    androidManifest.slice(activityStart + activityMatch[0].length);

  const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.arownd.app" android:host="auth" android:path="/callback" />
            </intent-filter>
`;
  await writeFile(
    androidManifestPath,
    manifestWithLaunchMode.slice(0, activityEnd + activityTag.length - activityMatch[0].length) +
      intentFilter +
      manifestWithLaunchMode.slice(activityEnd + activityTag.length - activityMatch[0].length),
  );
}

let iosInfoPlist = await readFile(iosInfoPlistPath, "utf8");
if (!iosInfoPlist.includes("<string>com.arownd.app</string>")) {
  const urlType = `
    <key>CFBundleURLTypes</key>
    <array>
      <dict>
        <key>CFBundleURLName</key>
        <string>com.arownd.app.auth</string>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>com.arownd.app</string>
        </array>
      </dict>
    </array>
`;
  const closingDict = iosInfoPlist.lastIndexOf("</dict>");
  if (closingDict < 0) throw new Error("Could not locate the root Info.plist dictionary");
  iosInfoPlist = iosInfoPlist.slice(0, closingDict) + urlType + iosInfoPlist.slice(closingDict);
  await writeFile(iosInfoPlistPath, iosInfoPlist);
}

console.log("Registered com.arownd.app://auth/callback on Android and iOS.");
