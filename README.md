# gmail-autoooo


# Gmail Auto-OOO Signature Updater

A Google Apps Script that automatically updates your Gmail signature to include a list of your upcoming planned absences. It runs in the background every night, reads your Google Calendar for "Out of Office" events over the next 3 months, and appends a clean, formatted list to your standard email signature. 

When you return to work and have no upcoming time off, it automatically resets your signature back to normal.

## Features
* **Smart Date Merging:** Automatically groups consecutive days off into clean ranges (e.g., `14th Apr | 16-17th Apr | 25-30th May`).
* **Timezone Aware:** Anchors dates to strictly prevent "off-by-one" day errors caused by midnight timezone shifts.
* **Alias Aware:** Automatically detects and applies the update to your primary "Send As" Gmail alias.

---

## 🚀 Setup Instructions

### Step 1: Create the Project
1. Go to [script.google.com](https://script.google.com) and sign in with your Google Workspace account.
2. Click **New Project** in the top left.
3. Click on "Untitled project" at the top and rename it to something like `Automated OOO Signature`.

### Step 2: Enable Required APIs
For the script to read your calendar and update your Gmail settings, you must enable two advanced services.
1. On the far-left sidebar, click the **+** icon next to **Services**.
2. Scroll down, select **Google Calendar API**, and click **Add**.
3. Click the **+** icon next to **Services** again.
4. Scroll down, select **Gmail API**, and click **Add**.

### Step 3: Add the Files
You will copy the three files from this repository into your Apps Script project.

**1. Code.gs**
* In the Apps Script editor, you should already have a file named `Code.gs` open. 
* Delete the empty function inside it and paste the entire contents of the `Code.gs` file from this repo.

**2. signature.html**
* On the left sidebar, click the **+** icon next to **Files** and select **HTML**.
* Name the file exactly `signature` (do not type `.html`, Google adds it automatically).
* Delete the default code and paste your custom HTML signature into this file (see "Customizing Your Signature" below).

**3. appsscript.json (The Manifest File)**
* Click the **gear icon (Project Settings)** on the far-left sidebar.
* Check the box for **"Show 'appsscript.json' manifest file in editor"**.
* Click the **code brackets (< >)** on the left sidebar to go back to your files.
* Click on `appsscript.json`, delete its contents, and paste the contents of `appsscript.json` from this repo.

### Step 4: Authorize the Script
You must run the script manually once to grant it permissions to your account.
1. Make sure you are on `Code.gs` and select `updateOOOSignature` from the function dropdown at the top.
2. Click **Run**.
3. A popup will say "Authorization Required." Click **Review permissions**.
4. Choose your Google account -> click **Advanced** at the bottom -> click **Go to Automated OOO Signature**.
5. Click **Allow**. 
*(Note: If you check the Execution Log, it will likely output your upcoming OOO dates and successfully update your signature!)*

### Step 5: Schedule the Automation (The Trigger)
Now, set the script to run automatically while you sleep.
1. Click the **clock icon (Triggers)** on the far-left sidebar.
2. Click **+ Add Trigger** in the bottom right corner.
3. Configure it exactly like this:
   * Choose which function to run: `updateOOOSignature`
   * Select event source: `Time-driven`
   * Select type of time based trigger: `Day timer`
   * Select time of day: `Midnight to 1am`
4. Click **Save**.

You're done! The script will now check your calendar every night.

---

**How to extract your current Gmail signature:**
If you don't know the HTML for your current signature, open a new compose window in Gmail, highlight your signature, right-click and select **Inspect**. Find the `<div>` wrapping your signature, right-click it, select **Copy outerHTML**, and paste it into `signature.html`.

---

## 🛠 Troubleshooting

* **My events aren't showing up:** The script specifically looks for events created using the native **"Out of office"** button in Google Calendar, OR regular events that have the letters **"OOO"** in the title. If you create a regular event called "Vacation", it will be ignored. 
* **The signature isn't updating:** Ensure your `appsscript.json` file is correctly saved with the required OAuth scopes (`gmail.settings.basic`). If it fails, check the **Executions** tab (bulleted list icon) in Apps Script to read the error logs.
