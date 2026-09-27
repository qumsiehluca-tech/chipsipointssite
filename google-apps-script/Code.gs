/**
 * Alpha Nu Tau — Chi Psi Points System backend.
 *
 * Deploy this attached to the points workbook (Extensions → Apps Script),
 * then Deploy → New deployment → type "Web app" → execute as "Me" →
 * who has access "Anyone". Copy the /exec URL into the website's
 * SHEETS_API_URL environment variable.
 *
 * Before deploying, set two Script Properties (Project Settings → Script
 * Properties): ADMIN_PASSWORD and VIEWER_PASSWORD. Passwords never live in
 * this source file, so this script is safe to share/commit.
 */

var LOG_SHEET = "Log";
var LEADERBOARD_SHEET = "Leaderboard";
var POINT_VALUES_SHEET = "Point Values";
var LOG_HEADER_ROW = 4; // row 4 holds "Date | Brother Name | Action | Points | Notes | Logged By"
var LOG_FIRST_DATA_ROW = 5;

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var role = authenticate_(params.password);
    if (!role) {
      return jsonResponse_({ error: "unauthorized" }, 401);
    }

    var payload = {
      role: role,
      brothers: getBrothers_(),
      pointValues: role === "admin" ? getPointValues_() : undefined
    };
    return jsonResponse_(payload, 200);
  } catch (err) {
    return jsonResponse_({ error: String(err) }, 500);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var role = authenticate_(body.password);
    if (role !== "admin") {
      return jsonResponse_({ error: "unauthorized" }, 401);
    }

    var action = body.action || "log";
    if (action === "log") {
      var entries = body.entries || [];
      if (!entries.length) {
        return jsonResponse_({ error: "no entries" }, 400);
      }
      appendLogEntries_(entries);
    } else if (action === "update") {
      updateLogEntry_(body.row, body.entry || {});
    } else if (action === "delete") {
      deleteLogEntry_(body.row);
    } else if (action === "addBrother") {
      addBrother_(body.name);
    } else {
      return jsonResponse_({ error: "unknown action" }, 400);
    }

    return jsonResponse_({ ok: true, brothers: getBrothers_() }, 200);
  } catch (err) {
    return jsonResponse_({ error: String(err) }, 500);
  }
}

/** Returns "admin", "viewer", or null. */
function authenticate_(password) {
  if (!password) return null;
  var props = PropertiesService.getScriptProperties();
  var adminPw = props.getProperty("ADMIN_PASSWORD");
  var viewerPw = props.getProperty("VIEWER_PASSWORD");
  if (adminPw && password === adminPw) return "admin";
  if (viewerPw && password === viewerPw) return "viewer";
  return null;
}

function getLogRows_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  var lastRow = sheet.getLastRow();
  if (lastRow < LOG_FIRST_DATA_ROW) return [];

  var range = sheet.getRange(
    LOG_FIRST_DATA_ROW,
    1,
    lastRow - LOG_FIRST_DATA_ROW + 1,
    6
  );
  var values = range.getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var name = row[1];
    if (!name) continue; // skip blank rows
    rows.push({
      row: LOG_FIRST_DATA_ROW + i, // actual sheet row — lets the admin UI edit/delete this exact entry
      date: formatDate_(row[0]),
      name: String(name).trim(),
      action: row[2],
      points: Number(row[3]) || 0,
      notes: row[4] || "",
      loggedBy: row[5] || ""
    });
  }
  return rows;
}

function getBrothers_() {
  var names = getRosterNames_();
  var rows = getLogRows_();
  var byName = {};
  rows.forEach(function (row) {
    if (!byName[row.name]) byName[row.name] = [];
    byName[row.name].push(row);
  });

  // Roster names come from the Leaderboard sheet, not just from who already
  // has a Log entry — otherwise a brother with zero points (no history yet)
  // would never appear on the site at all.
  var allNames = names.slice();
  Object.keys(byName).forEach(function (name) {
    if (allNames.indexOf(name) === -1) allNames.push(name);
  });

  var brothers = allNames.map(function (name) {
    var history = (byName[name] || []).sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    var total = history.reduce(function (sum, h) {
      return sum + h.points;
    }, 0);
    return {
      slug: slugify_(name),
      name: name,
      total: total,
      history: history
    };
  });

  brothers.sort(function (a, b) {
    return b.total - a.total;
  });
  return brothers;
}

function getRosterNames_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    LEADERBOARD_SHEET
  );
  var lastRow = sheet.getLastRow();
  if (lastRow < 5) return [];
  var values = sheet.getRange(5, 2, lastRow - 4, 1).getValues(); // column B = Brother Name
  return values
    .map(function (row) {
      return String(row[0] || "").trim();
    })
    .filter(function (name) {
      return name;
    });
}

function getPointValues_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    POINT_VALUES_SHEET
  );
  var lastRow = sheet.getLastRow();
  if (lastRow < 5) return [];
  var values = sheet.getRange(5, 1, lastRow - 4, 3).getValues();
  return values
    .filter(function (row) {
      return row[1];
    })
    .map(function (row) {
      return { type: row[0], action: row[1], points: Number(row[2]) || 0 };
    });
}

function appendLogEntries_(entries) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    LOG_SHEET
  );
  var startRow = Math.max(sheet.getLastRow() + 1, LOG_FIRST_DATA_ROW);
  var rows = entries.map(function (entry) {
    return [
      entry.date || todayIso_(),
      entry.name,
      entry.action,
      Number(entry.points) || 0,
      entry.notes || "",
      entry.loggedBy || ""
    ];
  });
  sheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
}

function updateLogEntry_(row, entry) {
  if (!row) throw new Error("missing row");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  sheet
    .getRange(row, 1, 1, 6)
    .setValues([
      [
        entry.date || todayIso_(),
        entry.name,
        entry.action,
        Number(entry.points) || 0,
        entry.notes || "",
        entry.loggedBy || ""
      ]
    ]);
}

function deleteLogEntry_(row) {
  if (!row) throw new Error("missing row");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  sheet.deleteRow(row);
}

/**
 * Adds a brand-new brother: writes their name into the first open row on
 * the Leaderboard sheet (the Rank/Total/link formulas are already prefilled
 * down to row 104, so only the name cell needs filling), then duplicates
 * the hidden Template tab for their own history view inside the sheet.
 */
function addBrother_(name) {
  name = String(name || "").trim();
  if (!name) throw new Error("missing name");

  var existing = getRosterNames_();
  if (existing.indexOf(name) !== -1) {
    throw new Error("that brother is already on the roster");
  }

  var lb = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADERBOARD_SHEET);
  var names = lb.getRange(5, 2, 100, 1).getValues(); // B5:B104
  var targetRow = -1;
  for (var i = 0; i < names.length; i++) {
    if (!String(names[i][0] || "").trim()) {
      targetRow = 5 + i;
      break;
    }
  }
  if (targetRow === -1) throw new Error("the Leaderboard sheet is full");
  lb.getRange(targetRow, 2).setValue(name);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var template = ss.getSheetByName("Template");
  if (template) {
    var newSheet = template.copyTo(ss);
    newSheet.showSheet();
    newSheet.setName(name.substring(0, 90));
    newSheet.getRange("B1").setValue(name);
  }
}

function slugify_(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "");
}

function todayIso_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}

function jsonResponse_(data, status) {
  // ContentService can't set arbitrary status codes, but the body always
  // carries enough info for the client to tell success from failure.
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
