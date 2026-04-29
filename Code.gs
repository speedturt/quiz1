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

    // Write header row on first use; patch Q6 if sheet predates this update
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Full Name',
        'Phone Number',
        'Email',
        'Q1 — Investment Experience',
        'Q2 — Capital Ready',
        'Q3 — Financial Situation',
        'Q4 — Main Challenge',
        'Q5 — Brokerage Account',
        'Q6 — Deposit Ready',
      ]);
      var header = sheet.getRange(1, 1, 1, 10);
      header.setFontWeight('bold');
      header.setBackground('#0f172a');
      header.setFontColor('#38bdf8');
    } else if (sheet.getLastColumn() < 10) {
      // Existing sheet missing Q6 column — add it
      var q6Cell = sheet.getRange(1, 10);
      q6Cell.setValue('Q6 — Deposit Ready');
      q6Cell.setFontWeight('bold').setBackground('#0f172a').setFontColor('#38bdf8');
    }

    // Force phone column (C) to plain text so "+91…" isn't parsed as a formula
    sheet.getRange(1, 3, sheet.getMaxRows(), 1).setNumberFormat('@');

    // Append lead row — order matches header exactly
    sheet.appendRow([
      new Date().toISOString(),
      data.name  || '',
      data.phone || '',
      data.email || '',
      data.q1    || '',
      data.q2    || '',
      data.q3    || '',
      data.q4    || '',
      data.q5    || '',
      data.q6    || '',
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 10);

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
        q4:    'Worried about risks',
        q5:    'Active brokerage account',
        q6:    'Ready — $150',
      })
    }
  };
  var result = doPost(mock);
  Logger.log(result.getContent());
}
