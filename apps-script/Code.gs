/**
 * AU TOOLKIT BUYER ACCESS SYSTEM — GOOGLE APPS SCRIPT BACKEND
 *
 * REAL SPREADSHEET SCHEMA (Sheet name: "AU Toolkit PRO"):
 * - Column O (col 15, index 14): Tanggal / Purchase Date (Lynk.id Order Date)
 * - Column P (col 16, index 15): Expiration Date (P = O + 30 calendar days or preserved manual date)
 * - Column Q (col 17, index 16): Status Account ("Active" | "Expired")
 * - Column R (col 18, index 17): Device Handphone (readable mobile device label, e.g. "Android Device")
 * - Column S (col 19, index 18): Device Laptop (readable desktop/laptop device label, e.g. "Windows Laptop")
 * - Column T (col 20, index 19): Lynk.id Status (e.g. "SUCCESS") — READ ONLY, NEVER OVERWRITE!
 * - Column U (col 21, index 20): Buyer Email (From Lynk.id)
 * - Column V (col 22, index 21): Mobile Device ID (technical Mobile Device ID, e.g. "dev_mobile_xxxxxx")
 * - Column W (col 23, index 22): Laptop/Desktop Device ID (technical Laptop/Desktop Device ID, e.g. "dev_desktop_xxxxxx")
 * - Column X (col 24, index 23): Buyer Name (optional)
 *
 * Current AU Toolkit PRO fallback schema:
 * O = Purchase Date, P = Lynk.id Status, Q = Buyer Email, R = Buyer Name,
 * AA = Expiration Date, AB = Status Account, AC = Device Handphone,
 * AD = Device Laptop, AE = Mobile Device ID, AF = Laptop/Desktop Device ID.
 */

// Exact Google Spreadsheet ID (or configure in Script Properties under SPREADSHEET_ID)
var SPREADSHEET_ID = "1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88";
var SHEET_NAME = "AU Toolkit PRO";

/**
 * Helper to open the configured buyer sheet using the exact spreadsheet ID.
 * Strictly avoids SpreadsheetApp.getActiveSpreadsheet() and SpreadsheetApp.getActiveSheet().
 */
function getOrderSheet(providedSpreadsheetId) {
  var id = (providedSpreadsheetId && String(providedSpreadsheetId).trim()) || SPREADSHEET_ID;
  try {
    var propId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (propId && propId.trim()) {
      id = propId.trim();
    }
  } catch (e) {}

  if (!id || id === "YOUR_SPREADSHEET_ID") {
    return null;
  }

  try {
    var ss = SpreadsheetApp.openById(id);
    if (!ss) return null;
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheetByName("order");
    if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" tidak ditemukan.');
    return { ss: ss, sheet: sheet };
  } catch (err) {
    Logger.log("Error opening spreadsheet by ID: " + err);
    return null;
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  if (params && (params.email || params.action || params.user_email)) {
    return handleRequest(e);
  }
  return jsonResponse({
    success: true,
    service: "AU Toolkit Access API",
    status: "online"
  });
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = {};
    if (e && e.parameter) {
      for (var key in e.parameter) {
        if (e.parameter.hasOwnProperty(key)) {
          params[key] = e.parameter[key];
        }
      }
    }

    if (e && e.postData && e.postData.contents) {
      try {
        var body = JSON.parse(e.postData.contents);
        for (var bKey in body) {
          if (body.hasOwnProperty(bKey)) {
            params[bKey] = body[bKey];
          }
        }
      } catch (err) {}
    }

    var response = processVerification(params);
    return jsonResponse(response);
  } catch (err) {
    return jsonResponse({
      success: false,
      accessGranted: false,
      reason: "BACKEND_ERROR",
      message: "Terjadi kesalahan internal server: " + (err && err.message ? err.message : String(err))
    });
  }
}

/**
 * Main verification logic adhering strictly to AU Toolkit Buyer Access specification.
 */
function processVerification(params) {
  // 1. Normalize login email: trim() and lowercase()
  var queryEmail = String(params.email || params.buyer_email || params.user_email || '').trim().toLowerCase();
  var deviceId = String(params.deviceId || params.device_id || '').trim();
  var deviceLabel = String(params.deviceLabel || params.device_label || params.deviceModel || params.device_model || '').trim();
  var deviceType = String(params.deviceType || params.device_type || params.deviceSlot || '').trim().toLowerCase();

  // If email is missing
  if (!queryEmail) {
    return {
      success: true,
      accessGranted: false,
      reason: "BUYER_NOT_FOUND",
      status: "BUYER_NOT_FOUND",
      message: "Email pembelian tidak ditemukan."
    };
  }

  // 2. Open spreadsheet strictly using exact ID and configured buyer sheet
  var sheetContext = getOrderSheet(params.spreadsheetId);
  if (!sheetContext || !sheetContext.sheet) {
    return {
      success: false,
      accessGranted: false,
      reason: "BACKEND_ERROR",
      status: "BACKEND_ERROR",
      message: 'Gagal membuka sheet "' + SHEET_NAME + '" pada Google Spreadsheet.'
    };
  }

  var ss = sheetContext.ss;
  var sheet = sheetContext.sheet;
  var data;
  try {
    data = sheet.getDataRange().getValues();
  } catch (err) {
    return {
      success: false,
      accessGranted: false,
      reason: "BACKEND_ERROR",
      status: "BACKEND_ERROR",
      message: 'Gagal membaca data dari sheet "' + SHEET_NAME + '".'
    };
  }

  if (!data || data.length <= 1) {
    return {
      success: true,
      accessGranted: false,
      reason: "BUYER_NOT_FOUND",
      status: "BUYER_NOT_FOUND",
      message: "Email pembelian tidak ditemukan."
    };
  }

  var headers = data[0];
  var colMap = buildHeaderMapping(headers);

  // 3. Find ALL rows where normalized Buyer Email matches in Column U (colMap.email)
  var matchingEmailRows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowEmail = colMap.email !== -1 ? String(row[colMap.email] || '').trim().toLowerCase() : '';
    if (rowEmail && rowEmail === queryEmail) {
      matchingEmailRows.push({
        rowIndex: i,
        rowNumber: i + 1,
        row: row
      });
    }
  }

  // BUYER_NOT_FOUND: If email does not exist in Column U
  if (matchingEmailRows.length === 0) {
    return {
      success: true,
      accessGranted: false,
      reason: "BUYER_NOT_FOUND",
      status: "BUYER_NOT_FOUND",
      buyerEmail: queryEmail,
      message: "Email pembelian tidak ditemukan."
    };
  }

  // 4. LYNK.ID ORDER STATUS CHECK (Column T)
  // Access eligibility requires Column T normalized value === "SUCCESS".
  // If T is PENDING, FAILED, CANCELLED, REFUNDED, or anything other than SUCCESS:
  // DO NOT grant access. Return ORDER_NOT_SUCCESS.
  // AU Toolkit may READ Column T. AU Toolkit must NEVER write or overwrite Column T.
  var successfulRows = [];
  var lastKnownOrderStatus = "";
  for (var m = 0; m < matchingEmailRows.length; m++) {
    var candidateItem = matchingEmailRows[m];
    var rawStatus = colMap.orderStatus !== -1 ? String(candidateItem.row[colMap.orderStatus] || '').trim() : '';
    var normalizedStatusVal = rawStatus.toUpperCase();
    if (normalizedStatusVal === 'SUCCESS') {
      successfulRows.push(candidateItem);
    } else {
      if (rawStatus) {
        lastKnownOrderStatus = rawStatus;
      }
    }
  }

  if (successfulRows.length === 0) {
    return {
      success: true,
      accessGranted: false,
      reason: "ORDER_NOT_SUCCESS",
      status: "ORDER_NOT_SUCCESS",
      orderStatus: lastKnownOrderStatus || "NOT_SUCCESS",
      buyerEmail: queryEmail,
      message: "Status pesanan Lynk.id belum berstatus SUCCESS."
    };
  }

  // 5. DUPLICATE EMAIL / RENEWAL: Select the most recent successful order based on Purchase Date (Column O)
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
  var selectedOrder = null;
  var latestPurchaseTimestamp = -Infinity;

  for (var s = 0; s < successfulRows.length; s++) {
    var sItem = successfulRows[s];
    var rawPurch = colMap.purchaseDate !== -1 ? sItem.row[colMap.purchaseDate] : null;
    var purchTimestamp = parseOrderTimestamp(rawPurch, tz);

    if (selectedOrder === null) {
      selectedOrder = sItem;
      latestPurchaseTimestamp = purchTimestamp;
    } else {
      // Prioritize later purchase timestamp; on tie, choose subsequent row in sheet
      if (purchTimestamp > latestPurchaseTimestamp) {
        selectedOrder = sItem;
        latestPurchaseTimestamp = purchTimestamp;
      } else if (purchTimestamp === latestPurchaseTimestamp && sItem.rowNumber > selectedOrder.rowNumber) {
        selectedOrder = sItem;
      }
    }
  }

  var userRow = selectedOrder.row;
  var rowNumber = selectedOrder.rowNumber; // 1-based index for Google Sheets getRange()

  // 6. PURCHASE DATE (Column O)
  // Must come from Lynk.id order data.
  // If Column O is empty or invalid: DO NOT replace with today's date! Return INVALID_PURCHASE_DATA.
  var rawPurchase = colMap.purchaseDate !== -1 ? userRow[colMap.purchaseDate] : null;
  var purchaseDateFormatted = parseSafeDate(rawPurchase, tz);
  if (!purchaseDateFormatted) {
    return {
      success: true,
      accessGranted: false,
      reason: "INVALID_PURCHASE_DATA",
      status: "INVALID_PURCHASE_DATA",
      buyerEmail: queryEmail,
      message: 'Data tanggal pembelian tidak valid atau kosong di sheet "' + SHEET_NAME + '".'
    };
  }

  // 7. EXPIRATION DATE (Column P) - DUAL MODE (AUTOMATIC + MANUAL OVERRIDE)
  // Automatic Mode: If Column P is EMPTY, initialize with O + 30 calendar days and save to Column P.
  // Manual Mode: If Column P ALREADY HAS A VALID DATE, preserve it as canonical. DO NOT overwrite P!
  var rawExp = colMap.expirationDate !== -1 ? userRow[colMap.expirationDate] : null;
  var expirationDateFormatted = parseSafeDate(rawExp, tz);

  if (!expirationDateFormatted) {
    var canonicalExpDate = computeDatePlusDays(purchaseDateFormatted, 30);
    expirationDateFormatted = canonicalExpDate;
    try {
      if (colMap.expirationDate !== -1) {
        sheet.getRange(rowNumber, colMap.expirationDate + 1).setValue(formatDisplayDate(expirationDateFormatted));
      }
    } catch (e) {}
  }

  // 8. STATUS ACCOUNT (Column Q) & FINAL ACCESS RULE
  // Column Q = Status Account.
  // Normalization: trim().toLowerCase()
  var rawStatusAccount = colMap.statusAccount !== -1 ? String(userRow[colMap.statusAccount] || '').trim() : '';
  var normalizedStatus = rawStatusAccount.toLowerCase();
  var isManuallyExpired = (normalizedStatus === 'expired');

  // Days remaining based on canonical expiration date (Column P)
  var daysRemaining = calculateDaysDifference(expirationDateFormatted, tz);
  var isDateExpired = (daysRemaining <= 0);

  // 9. FINAL EXPIRATION RULE:
  // Access must be denied when EITHER condition is true:
  // Condition A: Status Account === Expired (isManuallyExpired, manual admin lockout)
  // OR
  // Condition B: current date >= Expiration Date (isDateExpired, auto expiration)
  if (isManuallyExpired || isDateExpired) {
    // Auto Expiration: If date is expired and Q is not yet "Expired", write "Expired" to Column Q
    if (isDateExpired && rawStatusAccount !== "Expired" && colMap.statusAccount !== -1) {
      try {
        sheet.getRange(rowNumber, colMap.statusAccount + 1).setValue("Expired");
      } catch (e) {}
    }

    return {
      success: true,
      accessGranted: false,
      reason: "ACCOUNT_EXPIRED",
      status: "ACCOUNT_EXPIRED",
      statusAccount: "Expired",
      daysRemaining: 0,
      expirationDate: formatDisplayDate(expirationDateFormatted),
      purchaseDate: formatDisplayDate(purchaseDateFormatted),
      buyerEmail: queryEmail,
      message: "Masa berlangganan AU Toolkit Anda telah habis."
    };
  }

  // 10. ACTIVE STATUS:
  // If subscription is valid (today < P) and Q is empty: set Q = Active.
  if (!rawStatusAccount && colMap.statusAccount !== -1) {
    try {
      sheet.getRange(rowNumber, colMap.statusAccount + 1).setValue("Active");
      rawStatusAccount = "Active";
    } catch (e) {}
  }

  // NOTE: Column T contains Lynk.id Order Status (e.g. SUCCESS). AU Toolkit must NEVER write or overwrite Column T!

  // 11. DEVICE STORAGE & VALIDATION (REAL SPREADSHEET SCHEMA)
  // R = Device Handphone LABEL (Column 18, index colMap.deviceHandphone, default 17)
  // S = Device Laptop LABEL (Column 19, index colMap.deviceLaptop, default 18)
  // T = Lynk.id Status (Column 20, index colMap.orderStatus, default 19) — READ ONLY, NEVER OVERWRITE!
  // U = Buyer Email (Column 21, index colMap.email, default 20)
  // V = Mobile Device ID (Column 22, index colMap.mobileDeviceId, default 21)
  // W = Laptop/Desktop Device ID (Column 23, index colMap.laptopDeviceId, default 22)
  // X = Buyer Name (Column 24, index colMap.name, default 23)

  // Step 1: Detect and migrate any legacy rows where "deviceId || deviceLabel" was stored in R or S
  checkAndMigrateLegacyRow(sheet, rowNumber, userRow, colMap);

  var isMobile = (deviceType === 'mobile' || deviceType === 'handphone');
  var currentSlotLabel = isMobile ? 'mobile' : 'desktop';

  var idColIndex = isMobile ? colMap.mobileDeviceId : colMap.laptopDeviceId;
  var labelColIndex = isMobile ? colMap.deviceHandphone : colMap.deviceLaptop;

  if (idColIndex === -1) idColIndex = isMobile ? 21 : 22;
  if (labelColIndex === -1) labelColIndex = isMobile ? 17 : 18;

  // Step 2: Read registered technical ID from Column W (desktop) or Column V (mobile)
  var registeredTechnicalId = String(userRow[idColIndex] || '').trim();
  // Read human-readable device label from Column S (desktop) or Column R (mobile)
  var registeredReadableLabel = String(userRow[labelColIndex] || '').trim();

  // Current incoming device identity
  var effectiveDeviceId = deviceId || (isMobile ? ('dev_mobile_hw_' + Utilities.getUuid().slice(0, 8)) : ('dev_desktop_hw_' + Utilities.getUuid().slice(0, 8)));
  var effectiveLabel = deviceLabel || (isMobile ? 'Android Device' : 'Windows Laptop');
  var stableIncomingId = extractStableDeviceSignature(effectiveDeviceId) || effectiveDeviceId;

  // Step 3: Check if ID column (W for desktop, V for mobile) is empty
  if (!registeredTechnicalId || registeredTechnicalId === '') {
    // EMPTY: Register the stable hardware signature into W (or V) and save readable label into S (or R)
    // Never store a random browser-installation suffix in W or V as the primary registered device identity!
    try {
      sheet.getRange(rowNumber, idColIndex + 1).setValue(stableIncomingId);
      sheet.getRange(rowNumber, labelColIndex + 1).setValue(effectiveLabel);
      userRow[idColIndex] = stableIncomingId;
      userRow[labelColIndex] = effectiveLabel;
    } catch (e) {
      Logger.log("Error registering device: " + e);
    }
    registeredTechnicalId = stableIncomingId;
    registeredReadableLabel = effectiveLabel;
  } else {
    // ALREADY REGISTERED: Validate technical device ID using Column W (desktop) or Column V (mobile)
    var matches = isSameDeviceId(effectiveDeviceId, registeredTechnicalId);
    if (!matches) {
      // NEVER automatically overwrite a different registered device!
      return {
        success: true,
        accessGranted: false,
        reason: "DEVICE_MISMATCH",
        status: "DEVICE_MISMATCH",
        registeredDevice: registeredReadableLabel || registeredTechnicalId,
        deviceHandphone: (colMap.deviceHandphone !== -1 ? String(userRow[colMap.deviceHandphone] || '').trim() : '') || null,
        deviceLaptop: (colMap.deviceLaptop !== -1 ? String(userRow[colMap.deviceLaptop] || '').trim() : '') || null,
        mobileDeviceId: (colMap.mobileDeviceId !== -1 ? String(userRow[colMap.mobileDeviceId] || '').trim() : '') || null,
        laptopDeviceId: (colMap.laptopDeviceId !== -1 ? String(userRow[colMap.laptopDeviceId] || '').trim() : '') || null,
        deviceType: currentSlotLabel,
        statusAccount: "Active",
        purchaseDate: formatDisplayDate(purchaseDateFormatted),
        expirationDate: formatDisplayDate(expirationDateFormatted),
        buyerEmail: queryEmail,
        message: "Perangkat ini tidak terdaftar untuk akun Anda."
      };
    }

    // MATCHED! Normalize legacy ID in Column W (or V) to clean stable signature if needed
    if (stableIncomingId && registeredTechnicalId !== stableIncomingId) {
      try {
        sheet.getRange(rowNumber, idColIndex + 1).setValue(stableIncomingId);
        userRow[idColIndex] = stableIncomingId;
        registeredTechnicalId = stableIncomingId;
      } catch (normErr) {
        Logger.log("Error normalizing device signature in spreadsheet: " + normErr);
      }
    }

    // If ID matches, but readable label in S/R was missing, save the label
    if (!registeredReadableLabel && effectiveLabel) {
      try {
        sheet.getRange(rowNumber, labelColIndex + 1).setValue(effectiveLabel);
        userRow[labelColIndex] = effectiveLabel;
        registeredReadableLabel = effectiveLabel;
      } catch (e) {}
    }
  }

  // 12. ACCESS GRANTED
  var buyerName = colMap.name !== -1 ? String(userRow[colMap.name] || '').trim() : '';
  if (!buyerName) buyerName = queryEmail.split('@')[0];

  return {
    success: true,
    accessGranted: true,
    reason: "ACCESS_GRANTED",
    status: "ACCESS_GRANTED",
    statusAccount: "Active",
    purchaseDate: formatDisplayDate(purchaseDateFormatted),
    expirationDate: formatDisplayDate(expirationDateFormatted),
    daysRemaining: daysRemaining,
    buyerEmail: queryEmail,
    buyerName: buyerName,
    registeredDevice: registeredReadableLabel || registeredTechnicalId,
    deviceHandphone: (colMap.deviceHandphone !== -1 ? String(userRow[colMap.deviceHandphone] || '').trim() : '') || null,
    deviceLaptop: (colMap.deviceLaptop !== -1 ? String(userRow[colMap.deviceLaptop] || '').trim() : '') || null,
    mobileDeviceId: (colMap.mobileDeviceId !== -1 ? String(userRow[colMap.mobileDeviceId] || '').trim() : '') || null,
    laptopDeviceId: (colMap.laptopDeviceId !== -1 ? String(userRow[colMap.laptopDeviceId] || '').trim() : '') || null,
    deviceType: currentSlotLabel,
    message: "Akses aktif."
  };
}

/**
 * Detects and migrates legacy rows where "deviceId || deviceLabel" was stored
 * inside Column R (Device Handphone) or Column S (Device Laptop).
 *
 * Migrates to:
 * Desktop/Laptop:
 *   S = human-readable device label (e.g., "Windows Laptop")
 *   W = technical desktop device ID (e.g., "dev_desktop_hw_abc123_xyz")
 *
 * Mobile:
 *   R = human-readable device label (e.g., "Android Device")
 *   V = technical mobile device ID (e.g., "dev_mobile_hw_abc123_xyz")
 *
 * Performs this migration once without changing the registered physical device.
 */
function checkAndMigrateLegacyRow(sheet, rowNumber, userRow, colMap) {
  var sCol = (colMap && colMap.deviceLaptop !== -1) ? colMap.deviceLaptop : 18;
  var wCol = (colMap && colMap.laptopDeviceId !== -1) ? colMap.laptopDeviceId : 22;
  var rCol = (colMap && colMap.deviceHandphone !== -1) ? colMap.deviceHandphone : 17;
  var vCol = (colMap && colMap.mobileDeviceId !== -1) ? colMap.mobileDeviceId : 21;

  // 1. Desktop / Laptop Migration (Columns S & W)
  var rawS = String(userRow[sCol] || '').trim();
  var rawW = String(userRow[wCol] || '').trim();

  if (rawS.indexOf('||') !== -1 || (rawS.indexOf('dev_') === 0 && !rawW)) {
    var desktopParts = rawS.split('||');
    var p0 = desktopParts[0].trim();
    var p1 = desktopParts.length > 1 ? desktopParts.slice(1).join('||').trim() : '';

    var extractedDesktopId = '';
    var extractedDesktopLabel = '';

    if (p0.indexOf('dev_') === 0 || p0.indexOf('hw_') !== -1) {
      extractedDesktopId = p0;
      extractedDesktopLabel = p1 || 'Windows Laptop';
    } else if (p1.indexOf('dev_') === 0 || p1.indexOf('hw_') !== -1) {
      extractedDesktopId = p1;
      extractedDesktopLabel = p0 || 'Windows Laptop';
    } else {
      extractedDesktopId = p0;
      extractedDesktopLabel = p1 || 'Windows Laptop';
    }

    if (extractedDesktopLabel.indexOf('dev_') === 0) {
      extractedDesktopLabel = 'Windows Laptop';
    }

    var finalW = extractStableDeviceSignature(rawW || extractedDesktopId) || (rawW || extractedDesktopId);
    var finalS = extractedDesktopLabel;

    try {
      sheet.getRange(rowNumber, sCol + 1).setValue(finalS);
      sheet.getRange(rowNumber, wCol + 1).setValue(finalW);
      userRow[sCol] = finalS;
      userRow[wCol] = finalW;
    } catch (e) {
      Logger.log("Error migrating desktop legacy row " + rowNumber + ": " + e);
    }
  }

  // 2. Mobile Migration (Columns R & V)
  var rawR = String(userRow[rCol] || '').trim();
  var rawV = String(userRow[vCol] || '').trim();

  if (rawR.indexOf('||') !== -1 || (rawR.indexOf('dev_') === 0 && !rawV)) {
    var mobileParts = rawR.split('||');
    var mp0 = mobileParts[0].trim();
    var mp1 = mobileParts.length > 1 ? mobileParts.slice(1).join('||').trim() : '';

    var extractedMobileId = '';
    var extractedMobileLabel = '';

    if (mp0.indexOf('dev_') === 0 || mp0.indexOf('hw_') !== -1) {
      extractedMobileId = mp0;
      extractedMobileLabel = mp1 || 'Android Device';
    } else if (mp1.indexOf('dev_') === 0 || mp1.indexOf('hw_') !== -1) {
      extractedMobileId = mp1;
      extractedMobileLabel = mp0 || 'Android Device';
    } else {
      extractedMobileId = mp0;
      extractedMobileLabel = mp1 || 'Android Device';
    }

    if (extractedMobileLabel.indexOf('dev_') === 0) {
      extractedMobileLabel = 'Android Device';
    }

    var finalV = extractStableDeviceSignature(rawV || extractedMobileId) || (rawV || extractedMobileId);
    var finalR = extractedMobileLabel;

    try {
      sheet.getRange(rowNumber, rCol + 1).setValue(finalR);
      sheet.getRange(rowNumber, vCol + 1).setValue(finalV);
      userRow[rCol] = finalR;
      userRow[vCol] = finalV;
    } catch (e) {
      Logger.log("Error migrating mobile legacy row " + rowNumber + ": " + e);
    }
  }
}

/**
 * Extracts the stable hardware signature from any device ID string.
 * Strips out browser-specific random installation suffixes.
 * Examples:
 *   "dev_desktop_hw_a5d42bc6_0103852bb389" -> "dev_desktop_hw_a5d42bc6"
 *   "dev_desktop_hw_a5d42bc6" -> "dev_desktop_hw_a5d42bc6"
 *   "dev_mobile_hw_7b31ef82_xyz" -> "dev_mobile_hw_7b31ef82"
 */
function extractStableDeviceSignature(rawId) {
  if (!rawId) return '';
  var id = String(rawId).trim().toLowerCase();
  if (id.indexOf('||') !== -1) {
    id = id.split('||')[0].trim();
  }

  // Check for hardware hash pattern hw_<hex>
  var hwMatch = id.match(/hw_([a-f0-9]{6,16})/);
  if (hwMatch) {
    var isMobile = (id.indexOf('mobile') !== -1 || id.indexOf('handphone') !== -1);
    var slot = isMobile ? 'mobile' : 'desktop';
    return 'dev_' + slot + '_hw_' + hwMatch[1];
  }

  return id;
}

/**
 * Extracts raw hardware hash from device ID string.
 */
function extractHardwareHash(rawId) {
  if (!rawId) return '';
  var match = String(rawId).toLowerCase().match(/hw_([a-f0-9]{6,16})/);
  return match ? match[1] : '';
}

/**
 * Stable device comparison using technical device ID stored in Column V / W.
 * Evaluates exact match, stable hardware signature match, and hardware hash match.
 * If the stable hardware signature matches, it treats it as the SAME registered device
 * even if a legacy stored ID contains a trailing browser-specific suffix.
 */
function isSameDeviceId(currentDeviceId, registeredId) {
  if (!registeredId || !currentDeviceId) return false;

  var cId = String(currentDeviceId).trim().toLowerCase();
  var regId = String(registeredId).trim().toLowerCase();

  // If regId contains "||" from unmigrated legacy format, extract the ID part
  if (regId.indexOf('||') !== -1) {
    var parts = regId.split('||');
    var p0 = parts[0].trim();
    var p1 = parts.length > 1 ? parts[1].trim() : '';
    regId = (p0.indexOf('dev_') === 0 || p0.indexOf('hw_') !== -1) ? p0 : p1;
  }

  // 1. Exact ID string match
  if (cId === regId) return true;

  // 2. Stable hardware signature match (e.g. dev_desktop_hw_a5d42bc6)
  var stableCurrent = extractStableDeviceSignature(cId);
  var stableRegistered = extractStableDeviceSignature(regId);
  if (stableCurrent && stableRegistered && stableCurrent === stableRegistered) {
    return true;
  }

  // 3. Hardware hash match across browsers (hw_<hash>)
  var currentHash = extractHardwareHash(cId);
  var registeredHash = extractHardwareHash(regId);
  if (currentHash && registeredHash && currentHash === registeredHash) {
    return true;
  }

  // 4. Substring match on device ID (if both are valid technical device IDs and one contains the other)
  if (regId.length >= 12 && cId.length >= 12) {
    if (cId.indexOf(regId) !== -1 || regId.indexOf(cId) !== -1) {
      return true;
    }
  }

  return false;
}

/**
 * AUTOMATIC EXPIRATION UPDATE — DAILY TIME TRIGGER
 * Updates ONLY:
 * P = Expiration Date (P = O + 30 calendar days)
 * Q = Status Account ("Active" if today < P, "Expired" if today >= P)
 *
 * MUST NEVER modify R, S, T, U, V, W, or X!
 * Does NOT create subscriptions or replace empty/invalid purchase dates with today's date.
 */
function dailySubscriptionMaintenance() {
  var sheetContext = getOrderSheet();
  if (!sheetContext || !sheetContext.sheet) return;

  var ss = sheetContext.ss;
  var sheet = sheetContext.sheet;
  var data = sheet.getDataRange().getValues();
  if (!data || data.length <= 1) return;

  var headers = data[0];
  var colMap = buildHeaderMapping(headers);
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowNumber = i + 1;

    // Check Purchase Date in Column O. If empty or invalid, skip! Never invent dates.
    var rawPurchase = colMap.purchaseDate !== -1 ? row[colMap.purchaseDate] : null;
    var purchaseDateFormatted = parseSafeDate(rawPurchase, tz);
    if (!purchaseDateFormatted) continue;

    // Check Column T: Only maintain orders where Lynk.id Order Status is "SUCCESS".
    // Column T is owned by Lynk.id. AU Toolkit may READ Column T. AU Toolkit must NEVER write or overwrite Column T.
    var orderStatus = colMap.orderStatus !== -1 ? String(row[colMap.orderStatus] || '').trim().toUpperCase() : '';
    if (orderStatus && orderStatus !== 'SUCCESS') continue;

    // Daily automation:
    // If P is blank: P = O + 30 days
    // If P already exists: preserve P
    var rawExp = colMap.expirationDate !== -1 ? row[colMap.expirationDate] : null;
    var currentExpFormatted = parseSafeDate(rawExp, tz);

    if (!currentExpFormatted) {
      currentExpFormatted = computeDatePlusDays(purchaseDateFormatted, 30);
      if (colMap.expirationDate !== -1) {
        sheet.getRange(rowNumber, colMap.expirationDate + 1).setValue(formatDisplayDate(currentExpFormatted));
      }
    }

    var daysRemaining = calculateDaysDifference(currentExpFormatted, tz);
    var currentStatus = colMap.statusAccount !== -1 ? String(row[colMap.statusAccount] || '').trim() : '';

    if (daysRemaining <= 0) {
      if (currentStatus !== "Expired" && colMap.statusAccount !== -1) {
        sheet.getRange(rowNumber, colMap.statusAccount + 1).setValue("Expired");
      }
    } else {
      // today < P:
      // Automatic Mode: If Q is EMPTY, set Q = "Active".
      // If Q is already "Expired", DO NOT automatically convert back to Active (allows admin lockout).
      if (!currentStatus && colMap.statusAccount !== -1) {
        sheet.getRange(rowNumber, colMap.statusAccount + 1).setValue("Active");
      }
    }

    // STRICT: Columns R, S, T, U, V, W, X are NEVER touched!
  }
}

/**
 * Creates a daily trigger to execute dailySubscriptionMaintenance at 01:00 AM every day.
 */
function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'dailySubscriptionMaintenance' || fn === 'updateAllSubscriptions') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('dailySubscriptionMaintenance')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  Logger.log("Daily trigger for dailySubscriptionMaintenance created successfully at 01:00 AM.");
}

/**
 * Builds header mapping from Row 1 by inspecting header names and column positions.
 *
 * REAL SPREADSHEET SCHEMA:
 * - Column O (index 14): Tanggal / Purchase Date
 * - Column P (index 15): Expiration Date
 * - Column Q (index 16): Status Account
 * - Column R (index 17): Device Handphone (readable mobile label)
 * - Column S (index 18): Device Laptop (readable desktop/laptop label)
 * - Column T (index 19): Lynk.id Status (e.g. SUCCESS) — READ ONLY!
 * - Column U (index 20): Buyer Email
 * - Column V (index 21): Mobile Device ID (technical Mobile Device ID)
 * - Column W (index 22): Laptop/Desktop Device ID (technical Laptop/Desktop Device ID)
 * - Column X (index 23): Buyer Name (optional)
 */
function buildHeaderMapping(headers) {
  var map = {
    purchaseDate: -1,
    expirationDate: -1,
    statusAccount: -1,
    deviceHandphone: -1,
    deviceLaptop: -1,
    orderStatus: -1,
    email: -1,
    mobileDeviceId: -1,
    laptopDeviceId: -1,
    name: -1
  };

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase();
    if (!h) continue;

    if (h.indexOf('expiration date') !== -1 || h.indexOf('tgl expired') !== -1 || h.indexOf('expired date') !== -1) {
      map.expirationDate = c;
    } else if (h === 'status account' || h === 'status akun') {
      map.statusAccount = c;
    } else if (h.indexOf('mobile device id') !== -1 || h.indexOf('device id handphone') !== -1 || h.indexOf('device id hp') !== -1 || h.indexOf('id handphone') !== -1 || h.indexOf('id hp') !== -1) {
      map.mobileDeviceId = c;
    } else if (h.indexOf('laptop/desktop device id') !== -1 || h.indexOf('laptop device id') !== -1 || h.indexOf('desktop device id') !== -1 || h.indexOf('device id laptop') !== -1 || h.indexOf('id laptop') !== -1) {
      map.laptopDeviceId = c;
    } else if (h.indexOf('device handphone') !== -1 || h.indexOf('device hanphone') !== -1 || h.indexOf('device hp') !== -1 || h.indexOf('handphone') !== -1) {
      if (map.deviceHandphone === -1) map.deviceHandphone = c;
    } else if (h.indexOf('device laptop') !== -1 || h.indexOf('device pc') !== -1 || h.indexOf('laptop') !== -1) {
      if (map.deviceLaptop === -1) map.deviceLaptop = c;
    } else if (h === 'status' || h.indexOf('lynk.id status') !== -1 || h.indexOf('order status') !== -1 || h.indexOf('lynk') !== -1) {
      if (map.orderStatus === -1) map.orderStatus = c;
    } else if (h.indexOf('buyer email') !== -1 || h === 'email' || h.indexOf('user email') !== -1) {
      if (map.email === -1) map.email = c;
    } else if (h.indexOf('buyer name') !== -1 || h.indexOf('nama pembeli') !== -1 || h.indexOf('nama') !== -1 || h.indexOf('name') !== -1) {
      if (map.name === -1) map.name = c;
    } else if (h.indexOf('tanggal') !== -1 || h.indexOf('purchase') !== -1 || h.indexOf('tgl') !== -1) {
      if (map.purchaseDate === -1) map.purchaseDate = c;
    }
  }

  // Canonical index fallbacks from current AU Toolkit PRO schema:
  // O=14 (purchase), P=15 (order status), Q=16 (email), R=17 (buyer name),
  // AA=26 (expiration), AB=27 (account status), AC=28 (mobile label),
  // AD=29 (desktop label), AE=30 (mobile id), AF=31 (desktop id)
  if (map.purchaseDate === -1) map.purchaseDate = 14;
  if (map.expirationDate === -1) map.expirationDate = 26;
  if (map.statusAccount === -1) map.statusAccount = 27;
  if (map.deviceHandphone === -1) map.deviceHandphone = 28;
  if (map.deviceLaptop === -1) map.deviceLaptop = 29;
  if (map.orderStatus === -1) map.orderStatus = 15;
  if (map.email === -1) map.email = 16;
  if (map.mobileDeviceId === -1) map.mobileDeviceId = 30;
  if (map.laptopDeviceId === -1) map.laptopDeviceId = 31;
  if (map.name === -1) map.name = 17;

  return map;
}

/**
 * Adds N calendar days to a YYYY-MM-DD date.
 */
function computeDatePlusDays(dateStr, days) {
  var parts = dateStr.split('-');
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var d = parseInt(parts[2], 10);

  var dObj = new Date(Date.UTC(y, m, d + days));
  var resY = dObj.getUTCFullYear();
  var resM = ('0' + (dObj.getUTCMonth() + 1)).slice(-2);
  var resD = ('0' + dObj.getUTCDate()).slice(-2);
  return resY + '-' + resM + '-' + resD;
}

/**
 * Formats YYYY-MM-DD to DD-MM-YYYY for display in spreadsheet.
 */
function formatDisplayDate(ymdStr) {
  if (!ymdStr) return '';
  var p = ymdStr.split('-');
  if (p.length === 3) {
    return p[2] + '-' + p[1] + '-' + p[0];
  }
  return ymdStr;
}

/**
 * Calculates calendar day difference between expiration date (YYYY-MM-DD) and current date.
 */
function calculateDaysDifference(expDateStr, tz) {
  if (!expDateStr) return 0;
  var expParts = expDateStr.split('-');
  if (expParts.length !== 3) return 0;

  var expY = parseInt(expParts[0], 10);
  var expM = parseInt(expParts[1], 10) - 1;
  var expD = parseInt(expParts[2], 10);
  var expUtc = Date.UTC(expY, expM, expD);

  var todayFormatted = Utilities.formatDate(new Date(), tz || "Asia/Jakarta", "yyyy-MM-dd");
  var todayParts = todayFormatted.split('-');
  var todayUtc = Date.UTC(parseInt(todayParts[0], 10), parseInt(todayParts[1], 10) - 1, parseInt(todayParts[2], 10));

  var diffDays = Math.round((expUtc - todayUtc) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Safely parses Lynk.id Order Dates (e.g., '11-09-2026 20:35', Date object, ISO) into YYYY-MM-DD.
 */
function parseSafeDate(raw, tz) {
  if (!raw) return null;
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    return Utilities.formatDate(raw, tz || "Asia/Jakarta", "yyyy-MM-dd");
  }
  var str = String(raw).trim();
  if (!str) return null;

  // Check DD-MM-YYYY (Lynk.id standard: e.g. 11-09-2026 20:35)
  var matchDMY = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (matchDMY) {
    var d = ('0' + matchDMY[1]).slice(-2);
    var m = ('0' + matchDMY[2]).slice(-2);
    var y = matchDMY[3];
    return y + '-' + m + '-' + d;
  }

  // Check YYYY-MM-DD
  var matchYMD = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (matchYMD) {
    var year = matchYMD[1];
    var month = ('0' + matchYMD[2]).slice(-2);
    var day = ('0' + matchYMD[3]).slice(-2);
    return year + '-' + month + '-' + day;
  }

  try {
    var dObj = new Date(str);
    if (!isNaN(dObj.getTime())) {
      return Utilities.formatDate(dObj, tz || "Asia/Jakarta", "yyyy-MM-dd");
    }
  } catch (e) {}

  return null;
}

/**
 * Safely parses purchase date or order timestamp into epoch milliseconds for recency comparison.
 * Handles DD-MM-YYYY, YYYY-MM-DD, optional HH:mm[:ss], Date objects.
 */
function parseOrderTimestamp(raw, tz) {
  if (!raw) return -1;
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    return raw.getTime();
  }
  var str = String(raw).trim();
  if (!str) return -1;

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY with optional time
  var matchDMY = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (matchDMY) {
    var day = parseInt(matchDMY[1], 10);
    var month = parseInt(matchDMY[2], 10) - 1;
    var year = parseInt(matchDMY[3], 10);
    var hour = matchDMY[4] ? parseInt(matchDMY[4], 10) : 0;
    var min = matchDMY[5] ? parseInt(matchDMY[5], 10) : 0;
    var sec = matchDMY[6] ? parseInt(matchDMY[6], 10) : 0;
    return new Date(Date.UTC(year, month, day, hour, min, sec)).getTime();
  }

  // YYYY-MM-DD with optional time
  var matchYMD = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (matchYMD) {
    var yearY = parseInt(matchYMD[1], 10);
    var monthY = parseInt(matchYMD[2], 10) - 1;
    var dayY = parseInt(matchYMD[3], 10);
    var hourY = matchYMD[4] ? parseInt(matchYMD[4], 10) : 0;
    var minY = matchYMD[5] ? parseInt(matchYMD[5], 10) : 0;
    var secY = matchYMD[6] ? parseInt(matchYMD[6], 10) : 0;
    return new Date(Date.UTC(yearY, monthY, dayY, hourY, minY, secY)).getTime();
  }

  try {
    var d = new Date(str);
    var t = d.getTime();
    if (!isNaN(t)) return t;
  } catch (e) {}

  return -1;
}

