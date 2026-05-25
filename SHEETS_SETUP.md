# Google Sheets setup

## 1. Create the sheet

Create a new Google Sheet. Row 1 headers (exact order):

```
timestamp | hours_week | favorite_genre | play_style | life_lesson | mood_effect | creation | platform | esports | spend_month | advice
```

## 2. Apps Script

Open **Extensions → Apps Script** and paste:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    const headers = [
      'timestamp',
      'hours_week',
      'favorite_genre',
      'play_style',
      'life_lesson',
      'mood_effect',
      'creation',
      'platform',
      'esports',
      'spend_month',
      'advice',
    ];
    const row = headers.map((h) => data[h] ?? '');
    sheet.appendRow(row);
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

Save the project.

## 3. Deploy

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Copy the **Web app URL** (ends with `/exec`)

## 4. Configure the app

Create `.env` in the project root:

```
VITE_SHEETS_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

Restart the dev server after changing `.env`.

## 5. Test

1. Run `npm run dev`
2. Complete the survey on the last question
3. Confirm a new row appears in the sheet

## Demo mode

If `VITE_SHEETS_URL` is empty, submissions are saved to `localStorage` and logged to the browser console. A yellow banner appears at the top.

## CORS notes

The app sends `POST` with `Content-Type: text/plain` and a JSON body, which Apps Script accepts reliably. If you change the script, ensure `doPost` still parses `e.postData.contents`.
