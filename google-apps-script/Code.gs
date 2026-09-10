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

    var entries = body.entries || [];
    if (!entries.length) {
      return jsonResponse_({ error: "no entries" }, 400);
    }

    appendLogEntries_(entries);
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
  var rows = getLogRows_();
  var byName = {};
  rows.forEach(function (row) {
    if (!byName[row.name]) byName[row.name] = [];
    byName[row.name].push(row);
  });

  var brothers = Object.keys(byName).map(function (name) {
    var history = byName[name].sort(function (a, b) {
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
