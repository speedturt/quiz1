// ─────────────────────────────────────────────────────────────────
//  Oil Quiz — Google Apps Script Backend
//  Receives POST from index.html and appends a row to the Sheet.
// ─────────────────────────────────────────────────────────────────

var SHEET_NAME = 'Leads'; // Change if your tab has a different name

function doPost(e) {
  try {
    // URLSearchParams body — read via e.parameter (reliable with no-cors)
    var data = e.parameter;
    var sheet  = getOrCreateSheet(SHEET_NAME);

    // Write header row on first use
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Full Name',
        'Phone Number',
        'Email',
        'Q1 — Experience',
        'Q2 — Target Income',
        'Q3 — Occupation',
        'Q4 — Risk Tolerance',
        'Q5 — Contact Time',
      ]);

      // Style header
      var header = sheet.getRange(1, 1, 1, 9);
      header.setFontWeight('bold');
      header.setBackground('#0f172a');
      header.setFontColor('#38bdf8');
    }

    // Append lead row — order matches header exactly
    sheet.appendRow([
      new Date().toISOString(), // Timestamp always server-generated
      data.name  || '',
      data.phone || '',
      data.email || '',
      data.q1    || '',
      data.q2    || '',
      data.q3    || '',
      data.q4    || '',
      data.q5    || '',
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 9);

    return buildResponse({ result: 'success' });

  } catch (err) {
    return buildResponse({ result: 'error', message: err.message });
  }
}

// ── Returns the named sheet, or creates it if missing ──────────────
function getOrCreateSheet(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ── Builds a JSON ContentService response with CORS headers ────────
function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Quick manual test — run this from the editor to verify ─────────
function testDoPost() {
  var mock = {
    postData: {
      contents: JSON.stringify({
        name:  'Test User',
        phone: '+91 9876543210',
        email: 'testuser@gmail.com',
        q1:    'Intermediate',
        q2:    '₹1,00,000',
        q3:    'Business Owner',
        q4:    'Balanced',
        q5:    'Evening',
      })
    }
  };
  var result = doPost(mock);
  Logger.log(result.getContent());
}
