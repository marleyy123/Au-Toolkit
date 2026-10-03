/*****************************************************
 * AU TOOLKIT PRO
 * BUYER ACCESS + SUBSCRIPTION + DEVICE LOCK BACKEND
 *
 * Spreadsheet ID:
 * 1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88
 *
 * Sheet: AU Toolkit PRO
 *
 * FINAL SCHEMA:
 * O = Purchase Date / Tanggal
 * P = Status transaksi Lynk.id (READ ONLY)
 * Q = Buyer Email
 * R = Buyer Name (optional)
 * Z = Ref
 * Lynk spreadsheet is READ ONLY. Access state lives in AU Access:
 * A email, B Ref, C name, D purchase date, E expiry, F status,
 * G/H device labels, I/J device IDs.
 *****************************************************/

const CONFIG = {
  VERSION: '3.4.1-preserve-source-calendar-dates',
  SPREADSHEET_ID: '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88',
  SHEET_NAME: 'AU Toolkit PRO',
  ACCESS_SPREADSHEET_ID: '1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ',
  ACCESS_SHEET_NAME: 'AU Access',

  PURCHASE_DATE_COLUMN: 15,        // O = Tanggal
  ORDER_STATUS_COLUMN: 16,         // P = Status transaksi Lynk.id (READ ONLY)
  BUYER_EMAIL_COLUMN: 17,          // Q = Buyer Email
  BUYER_NAME_COLUMN: 18,           // R = Buyer Name

  TRANSACTION_REF_COLUMN: 26,
  ACCESS_EMAIL_COLUMN: 1,
  ACCESS_REF_COLUMN: 2,
  ACCESS_NAME_COLUMN: 3,
  ACCESS_PURCHASE_DATE_COLUMN: 4,
  EXPIRATION_DATE_COLUMN: 5,
  STATUS_ACCOUNT_COLUMN: 6,
  DEVICE_MOBILE_LABEL_COLUMN: 7,
  DEVICE_DESKTOP_LABEL_COLUMN: 8,
  DEVICE_MOBILE_ID_COLUMN: 9,
  DEVICE_DESKTOP_ID_COLUMN: 10,

  SUBSCRIPTION_DAYS: 30,
  ACTIVE_STATUS: 'Active',
  INACTIVE_STATUS: 'Inactive',
  EXPIRED_STATUS: 'Expired',
  SUCCESS_ORDER_STATUS: 'SUCCESS',
  TIMEZONE: 'Asia/Jakarta'
};

/*****************************************************
 * WEB APP — HEALTH CHECK
 *****************************************************/
function doGet() {
  try {
    const source = getMainSheet();
    const access = getAccessSheet();
    return jsonResponse({
      success: true,
      service: 'AU Toolkit Access API',
      status: 'online',
      version: CONFIG.VERSION,
      configuredSheetName: CONFIG.SHEET_NAME,
      selectedSheetName: source.getName(),
      accessSheetName: access.getName()
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      service: 'AU Toolkit Access API',
      status: 'configuration_error',
      version: CONFIG.VERSION,
      message: safeErrorMessage(error)
    });
  }
}

/*****************************************************
 * WEB APP — POST
 *****************************************************/
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        accessGranted: false,
        reason: 'INVALID_REQUEST'
      });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (error) {
      return jsonResponse({
        success: false,
        accessGranted: false,
        reason: 'INVALID_JSON_REQUEST'
      });
    }

    const expectedSecret = cleanString(
    PropertiesService.getScriptProperties().getProperty('API_SHARED_SECRET')
  );
  const providedSecret = cleanString(payload.serverSecret || payload.server_secret);

  if (!expectedSecret || expectedSecret.length < 32) {
    return jsonResponse({
      success: false,
      accessGranted: false,
      reason: 'APPS_SCRIPT_CONFIG_ERROR',
      message: 'API shared secret belum dikonfigurasi.'
    });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({
      success: false,
      accessGranted: false,
      reason: 'UNAUTHORIZED',
      message: 'Permintaan tidak diizinkan.'
    });
  }

  const action = cleanString(payload.action || 'validateAccess');

    switch (action) {
      case 'checkBuyerEmail':
        return jsonResponse(checkBuyerEmail(payload));

      case 'validateAccess':
        return jsonResponse(validateAccess(payload));

      case 'refreshSubscription':
        return jsonResponse(refreshSingleSubscription(payload));

      case 'healthCheck':
        return doGet();

      default:
        return jsonResponse({
          success: false,
          accessGranted: false,
          reason: 'UNKNOWN_ACTION'
        });
    }
  } catch (error) {
    console.error('doPost error:', error);
    return jsonResponse({
      success: false,
      accessGranted: false,
      reason: 'BACKEND_ERROR',
      message: safeErrorMessage(error)
    });
  }
}

/*****************************************************
 * READ-ONLY BUYER EMAIL CHECK
 *
 * Compatibility endpoint. This intentionally does not write
 * subscription, status, device cells, or headers.
 *****************************************************/
function checkBuyerEmail(payload) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    return deny('EMAIL_REQUIRED');
  }

  const sheet = getMainSheet();

  if (sheet.getLastRow() < 2) {
    return deny('NO_BUYER_DATA');
  }

  const buyerSelection = findLatestSuccessfulBuyer(sheet, email);

  if (!buyerSelection.emailFound) {
    return {
      success: true,
      accessGranted: false,
      reason: 'BUYER_NOT_FOUND',
      isRegisteredBuyer: false
    };
  }

  if (!buyerSelection.buyer) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ORDER_NOT_SUCCESS',
      isRegisteredBuyer: true,
      buyerEmail: email
    };
  }

  const row = buyerSelection.buyer.row;
  const access = getAccessRecord(buyerSelection.buyer, false);
  const accessRow = access.row;
  const purchaseDate = normalizeDate(accessRow[CONFIG.ACCESS_PURCHASE_DATE_COLUMN - 1]);
  if (!purchaseDate) {
    return {
      success: true,
      accessGranted: false,
      reason: 'INVALID_PURCHASE_DATA',
      isRegisteredBuyer: true,
      buyerEmail: email,
      buyerName: getBuyerName(row)
    };
  }

  const manualStatus = normalizeAccountStatus(accessRow[CONFIG.STATUS_ACCOUNT_COLUMN - 1]);
  if (manualStatus === CONFIG.INACTIVE_STATUS) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_INACTIVE',
      statusAccount: CONFIG.INACTIVE_STATUS,
      isRegisteredBuyer: true,
      buyerEmail: email,
      buyerName: getBuyerName(row)
    };
  }
  let expirationDate = normalizeDate(accessRow[CONFIG.EXPIRATION_DATE_COLUMN - 1]);
  if (!expirationDate && !isBlankValue(accessRow[CONFIG.EXPIRATION_DATE_COLUMN - 1])) {
    return deny('INVALID_PURCHASE_DATA');
  }
  if (!expirationDate) {
    expirationDate = new Date(purchaseDate.getTime());
    expirationDate.setDate(expirationDate.getDate() + CONFIG.SUBSCRIPTION_DAYS);
  }

  const today = getTodayInTimezone();
  const expirationOnly = toDateOnly(expirationDate);
  const daysRemaining = Math.ceil((expirationOnly.getTime() - today.getTime()) / 86400000);
  const expired = manualStatus === CONFIG.EXPIRED_STATUS || daysRemaining <= 0;

  if (expired) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_EXPIRED',
      statusAccount: CONFIG.EXPIRED_STATUS,
      isRegisteredBuyer: true,
      buyerEmail: email,
      buyerName: getBuyerName(row),
      purchaseDate: formatDateTime(purchaseDate),
      expirationDate: formatDate(expirationDate),
      daysRemaining: 0
    };
  }

  return {
    success: true,
    accessGranted: true,
    reason: 'BUYER_EMAIL_OK',
    statusAccount: CONFIG.ACTIVE_STATUS,
    isRegisteredBuyer: true,
    buyerEmail: email,
    buyerName: getBuyerName(row),
    purchaseDate: formatDateTime(purchaseDate),
    expirationDate: formatDate(expirationDate),
    daysRemaining: daysRemaining
  };
}

/*****************************************************
 * MAIN ACCESS VALIDATION
 *****************************************************/
function validateAccess(payload) {
  return withAccessLock(function() {
    return validateAccessLocked(payload);
  });
}

function validateAccessLocked(payload) {
  const email = normalizeEmail(payload.email);
  const deviceType = normalizeDeviceType(payload.deviceType);
  const deviceId = cleanString(payload.deviceId);
  const deviceLabel = sanitizeDeviceLabel(payload.deviceLabel, deviceType);

  if (!email) {
    return deny('EMAIL_REQUIRED');
  }

  if (!deviceType) {
    return deny('INVALID_DEVICE_TYPE');
  }

  if (!isUsableDeviceId(deviceId)) {
    return deny('DEVICE_ID_REQUIRED');
  }

  const sheet = getMainSheet();

  if (sheet.getLastRow() < 2) {
    return deny('NO_BUYER_DATA');
  }

  const buyerSelection = findLatestSuccessfulBuyer(sheet, email);

  if (!buyerSelection.emailFound) {
    return {
      success: true,
      accessGranted: false,
      reason: 'BUYER_NOT_FOUND'
    };
  }

  if (!buyerSelection.buyer) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ORDER_NOT_SUCCESS',
      buyerEmail: email
    };
  }

  const buyer = buyerSelection.buyer;
  const row = buyer.row;
  const access = getAccessRecord(buyer, true);
  const subscription = ensureSubscriptionData(access.sheet, access.rowNumber, access.row);

  if (!subscription.valid) {
    return {
      success: true,
      accessGranted: false,
      reason: 'INVALID_PURCHASE_DATA',
      buyerEmail: email,
      buyerName: getBuyerName(row)
    };
  }

  if (subscription.statusAccount === CONFIG.INACTIVE_STATUS) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_INACTIVE',
      statusAccount: CONFIG.INACTIVE_STATUS,
      buyerEmail: email,
      buyerName: getBuyerName(row)
    };
  }

  if (subscription.statusAccount === CONFIG.EXPIRED_STATUS) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_EXPIRED',
      statusAccount: CONFIG.EXPIRED_STATUS,
      buyerEmail: email,
      buyerName: getBuyerName(row),
      purchaseDate: subscription.purchaseDateFormatted,
      expirationDate: subscription.expirationDateFormatted,
      daysRemaining: 0
    };
  }

  const deviceValidation = validateAndRegisterDevice(
    access.sheet,
    access.rowNumber,
    deviceType,
    deviceId,
    deviceLabel
  );

  if (!deviceValidation.allowed) {
    return {
      success: true,
      accessGranted: false,
      reason: 'DEVICE_MISMATCH',
      statusAccount: subscription.statusAccount,
      buyerEmail: email,
      buyerName: getBuyerName(row),
      purchaseDate: subscription.purchaseDateFormatted,
      expirationDate: subscription.expirationDateFormatted,
      daysRemaining: subscription.daysRemaining,
      deviceType: deviceType,
      registeredDevice: deviceValidation.registeredDevice,
      deviceStatus: 'MISMATCH'
    };
  }

  // Never write to the Lynk transaction spreadsheet.
  return {
    success: true,
    accessGranted: true,
    reason: 'ACCESS_GRANTED',
    statusAccount: subscription.statusAccount,
    buyerEmail: email,
    buyerName: getBuyerName(row),
    purchaseDate: subscription.purchaseDateFormatted,
    expirationDate: subscription.expirationDateFormatted,
    daysRemaining: subscription.daysRemaining,
    deviceType: deviceType,
    registeredDevice: deviceValidation.registeredDevice,
    deviceStatus: deviceValidation.deviceStatus
  };
}

/*****************************************************
 * FIND BUYER
 *
 * Rules:
 * - Search ALL rows matching Q (Buyer Email)
 * - Only P = SUCCESS is eligible
 * - If multiple SUCCESS rows exist, choose the newest
 *   valid Purchase Date from O
 *****************************************************/
function findLatestSuccessfulBuyer(sheet, targetEmail) {
  let emailFound = false;
  const successfulRows = [];
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { emailFound: false, buyer: null };
  }

  const rowCount = lastRow - 1;
  const lastColumn = Math.max(
    sheet.getLastColumn(),
    CONFIG.TRANSACTION_REF_COLUMN
  );
  const rows = sheet
    .getRange(2, 1, rowCount, lastColumn)
    .getValues();

  for (let i = 0; i < rowCount; i++) {
    const row = rows[i];
    const rowEmail = normalizeEmail(row[CONFIG.BUYER_EMAIL_COLUMN - 1]);

    if (!rowEmail || rowEmail !== targetEmail) {
      continue;
    }

    emailFound = true;

    const orderStatus = normalizeOrderStatus(row[CONFIG.ORDER_STATUS_COLUMN - 1]);

    if (orderStatus !== CONFIG.SUCCESS_ORDER_STATUS) {
      continue;
    }

    const purchaseDate = normalizeDate(row[CONFIG.PURCHASE_DATE_COLUMN - 1]);
    const rowNumber = i + 2;

    successfulRows.push({
      rowNumber: rowNumber,
      row: row,
      purchaseDate: purchaseDate
    });
  }

  if (!successfulRows.length) {
    return { emailFound: emailFound, buyer: null };
  }

  const rowsWithValidDate = successfulRows.filter(function(item) {
    return !!item.purchaseDate;
  });

  if (rowsWithValidDate.length) {
    rowsWithValidDate.sort(function(a, b) {
      return b.purchaseDate.getTime() - a.purchaseDate.getTime();
    });

    return {
      emailFound: true,
      buyer: rowsWithValidDate[0]
    };
  }

  // Email + SUCCESS exists, but purchase dates are invalid.
  // Return the newest sheet row so subscription validation can
  // respond INVALID_PURCHASE_DATA instead of BUYER_NOT_FOUND.
  successfulRows.sort(function(a, b) {
    return b.rowNumber - a.rowNumber;
  });

  return {
    emailFound: true,
    buyer: successfulRows[0]
  };
}

/*****************************************************
 * SUBSCRIPTION — AUTOMATIC + MANUAL
 *
 * AU Access: D = purchase date, E = expiration date, F = status.
 *
 * Rules:
 * Preserve manual expiry and Inactive/Expired status.
 * Initialize a blank expiry once from purchase date + 30 days.
 *****************************************************/
function ensureSubscriptionData(sheet, rowNumber, row) {
  const purchaseRaw = row[CONFIG.ACCESS_PURCHASE_DATE_COLUMN - 1];
  const expirationRaw = row[CONFIG.EXPIRATION_DATE_COLUMN - 1];
  const statusRaw = cleanString(row[CONFIG.STATUS_ACCOUNT_COLUMN - 1]);

  const purchaseDate = normalizeDate(purchaseRaw);

  if (!purchaseDate) {
    return invalidSubscription();
  }

  let expirationDate;

  if (isBlankValue(expirationRaw)) {
    expirationDate = addCalendarDays(
      purchaseDate,
      CONFIG.SUBSCRIPTION_DAYS
    );

    sheet
      .getRange(rowNumber, CONFIG.EXPIRATION_DATE_COLUMN)
      .setNumberFormat('@')
      .setValue(formatDate(expirationDate));
  } else {
    expirationDate = normalizeDate(expirationRaw);

    // Never silently overwrite a manually entered invalid date.
    if (!expirationDate) {
      return invalidSubscription();
    }
  }

  const today = toDateOnly(getTodayInTimezone());
  const expiry = toDateOnly(expirationDate);

  const diffMs = expiry.getTime() - today.getTime();
  const daysRemainingRaw = Math.ceil(diffMs / 86400000);
  const daysRemaining = Math.max(0, daysRemainingRaw);

  const normalizedStatus = normalizeAccountStatus(statusRaw);

  // Manual deactivation must survive subscription refreshes.
  if (normalizedStatus === CONFIG.INACTIVE_STATUS) {
    return {
      valid: true,
      purchaseDate: purchaseDate,
      expirationDate: expirationDate,
      statusAccount: CONFIG.INACTIVE_STATUS,
      daysRemaining: daysRemaining,
      purchaseDateFormatted: formatDateTime(purchaseDate),
      expirationDateFormatted: formatDate(expirationDate)
    };
  }

  // Manual Expired is authoritative.
  if (normalizedStatus === CONFIG.EXPIRED_STATUS) {
    return {
      valid: true,
      purchaseDate: purchaseDate,
      expirationDate: expirationDate,
      statusAccount: CONFIG.EXPIRED_STATUS,
      daysRemaining: 0,
      purchaseDateFormatted: formatDateTime(purchaseDate),
      expirationDateFormatted: formatDate(expirationDate)
    };
  }

  // Expiration date reached/passed -> expire automatically.
  if (today.getTime() >= expiry.getTime()) {
    if (normalizedStatus !== CONFIG.EXPIRED_STATUS) {
      sheet
        .getRange(rowNumber, CONFIG.STATUS_ACCOUNT_COLUMN)
        .setValue(CONFIG.EXPIRED_STATUS);
    }

    return {
      valid: true,
      purchaseDate: purchaseDate,
      expirationDate: expirationDate,
      statusAccount: CONFIG.EXPIRED_STATUS,
      daysRemaining: 0,
      purchaseDateFormatted: formatDateTime(purchaseDate),
      expirationDateFormatted: formatDate(expirationDate)
    };
  }

  // Subscription is valid.
  // Preserve an explicit Active. If blank/unknown, normalize to Active.
  if (normalizedStatus !== CONFIG.ACTIVE_STATUS) {
    sheet
      .getRange(rowNumber, CONFIG.STATUS_ACCOUNT_COLUMN)
      .setValue(CONFIG.ACTIVE_STATUS);
  }

  return {
    valid: true,
    purchaseDate: purchaseDate,
    expirationDate: expirationDate,
    statusAccount: CONFIG.ACTIVE_STATUS,
    daysRemaining: daysRemaining,
    purchaseDateFormatted: formatDateTime(purchaseDate),
    expirationDateFormatted: formatDate(expirationDate)
  };
}

function invalidSubscription() {
  return {
    valid: false,
    statusAccount: null,
    daysRemaining: null,
    purchaseDateFormatted: null,
    expirationDateFormatted: null
  };
}

/*****************************************************
 * DEVICE LOCK
 *
 * Mobile:
 * G = label
 * I = ID
 *
 * Desktop:
 * H = label
 * J = ID
 *
 * Admin reset:
 * - clear I to allow a new phone
 * - clear J to allow a new laptop
 * Caller must hold the script lock through lookup and registration.
 *****************************************************/
function validateAndRegisterDevice(
  sheet,
  rowNumber,
  deviceType,
  deviceId,
  deviceLabel
) {
  const isMobile = deviceType === 'mobile';

  const labelColumn = isMobile
    ? CONFIG.DEVICE_MOBILE_LABEL_COLUMN
    : CONFIG.DEVICE_DESKTOP_LABEL_COLUMN;

  const idColumn = isMobile
    ? CONFIG.DEVICE_MOBILE_ID_COLUMN
    : CONFIG.DEVICE_DESKTOP_ID_COLUMN;

  {
    const labelCell = sheet.getRange(rowNumber, labelColumn);
    const idCell = sheet.getRange(rowNumber, idColumn);

    let registeredLabel = cleanString(labelCell.getDisplayValue());
    let registeredId = cleanString(idCell.getDisplayValue());

    // Migrate old combined device-label format:
    // dev_xxx || Windows Laptop
    if (registeredLabel && registeredLabel.indexOf(' || ') !== -1) {
      const legacy = decodeLegacyDevice(registeredLabel);

      if (legacy.deviceId && !registeredId) {
        registeredId = legacy.deviceId;
        idCell.setValue(registeredId);
      }

      if (legacy.deviceLabel) {
        registeredLabel = legacy.deviceLabel;
        labelCell.setValue(registeredLabel);
      }
    }

    // Admin reset: if technical ID is blank, register current device.
    if (!registeredId) {
      const finalLabel = deviceLabel || defaultDeviceLabel(deviceType);

      idCell.setValue(deviceId);
      labelCell.setValue(finalLabel);

      return {
        allowed: true,
        deviceStatus: 'REGISTERED',
        registeredDevice: finalLabel
      };
    }

    // Same registered technical device.
    if (registeredId === deviceId) {
      if (!registeredLabel && deviceLabel) {
        registeredLabel = deviceLabel;
        labelCell.setValue(registeredLabel);
      }

      return {
        allowed: true,
        deviceStatus: 'MATCHED',
        registeredDevice:
          registeredLabel || defaultDeviceLabel(deviceType)
      };
    }

    // Different device: do not overwrite.
    return {
      allowed: false,
      deviceStatus: 'MISMATCH',
      registeredDevice:
        registeredLabel || defaultDeviceLabel(deviceType)
    };
  }
}

/*****************************************************
 * DAILY SUBSCRIPTION UPDATE
 *
 * Only SUCCESS orders are processed.
 * For duplicate buyer emails, this function intentionally
 * evaluates rows independently. Runtime login still selects
 * the newest SUCCESS purchase for entitlement.
 *****************************************************/
function updateAllSubscriptions() {
  const sheet = getMainSheet();
  const lastRow = sheet.getLastRow();
  const summary = { processed: 0, invalid: 0, failed: 0 };

  if (lastRow < 2) {
    return summary;
  }

  const lastColumn = Math.max(
    sheet.getLastColumn(),
    CONFIG.TRANSACTION_REF_COLUMN
  );

  const rows = sheet
    .getRange(2, 1, lastRow - 1, lastColumn)
    .getValues();

  rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    const email = normalizeEmail(row[CONFIG.BUYER_EMAIL_COLUMN - 1]);
    const orderStatus = normalizeOrderStatus(
      row[CONFIG.ORDER_STATUS_COLUMN - 1]
    );

    if (!email || orderStatus !== CONFIG.SUCCESS_ORDER_STATUS) {
      return;
    }

    try {
      const result = withAccessLock(function() {
        const access = getAccessRecord({ row: row, rowNumber: rowNumber }, true);
        return ensureSubscriptionData(access.sheet, access.rowNumber, access.row);
      });
      if (result.valid) summary.processed++;
      else summary.invalid++;
    } catch (error) {
      summary.failed++;
      console.error(
        'Subscription update failed at row ' +
          rowNumber +
          ': ' +
          safeErrorMessage(error)
      );
    }
  });
  return summary;
}

/*****************************************************
 * CREATE DAILY TRIGGER
 * Run manually once after deployment.
 *****************************************************/
function createDailySubscriptionTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    if (
      trigger.getHandlerFunction() ===
      'updateAllSubscriptions'
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp
    .newTrigger('updateAllSubscriptions')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();
}

function runSubscriptionUpdateNow() {
  updateAllSubscriptions();
}

/*****************************************************
 * SINGLE BUYER REFRESH
 *****************************************************/
function refreshSingleSubscription(payload) {
  return withAccessLock(function() {
    return refreshSingleSubscriptionLocked(payload);
  });
}

function refreshSingleSubscriptionLocked(payload) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    return {
      success: false,
      reason: 'EMAIL_REQUIRED'
    };
  }

  const sheet = getMainSheet();
  const buyerSelection = findLatestSuccessfulBuyer(sheet, email);

  if (!buyerSelection.emailFound) {
    return {
      success: true,
      accessGranted: false,
      reason: 'BUYER_NOT_FOUND'
    };
  }

  if (!buyerSelection.buyer) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ORDER_NOT_SUCCESS'
    };
  }

  const access = getAccessRecord(buyerSelection.buyer, true);
  const result = ensureSubscriptionData(access.sheet, access.rowNumber, access.row);

  if (!result.valid) {
    return {
      success: true,
      accessGranted: false,
      reason: 'INVALID_PURCHASE_DATA'
    };
  }

  if (result.statusAccount === CONFIG.INACTIVE_STATUS) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_INACTIVE',
      statusAccount: CONFIG.INACTIVE_STATUS,
      expirationDate: result.expirationDateFormatted,
      daysRemaining: result.daysRemaining
    };
  }

  if (result.statusAccount === CONFIG.EXPIRED_STATUS) {
    return {
      success: true,
      accessGranted: false,
      reason: 'ACCOUNT_EXPIRED',
      statusAccount: CONFIG.EXPIRED_STATUS,
      expirationDate: result.expirationDateFormatted,
      daysRemaining: 0
    };
  }

  return {
    success: true,
    accessGranted: true,
    reason: 'SUBSCRIPTION_REFRESHED',
    statusAccount: CONFIG.ACTIVE_STATUS,
    expirationDate: result.expirationDateFormatted,
    daysRemaining: result.daysRemaining
  };
}

/*****************************************************
 * SPREADSHEET CONNECTION
 *****************************************************/
function getMainSheet() {
  const spreadsheet = SpreadsheetApp.openById(
    CONFIG.SPREADSHEET_ID
  );

  const configuredSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (configuredSheet) {
    return configuredSheet;
  }

  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const lastColumn = Math.max(sheet.getLastColumn(), CONFIG.TRANSACTION_REF_COLUMN);
    if (sheet.getLastRow() < 1 || lastColumn < CONFIG.BUYER_EMAIL_COLUMN) {
      continue;
    }

    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getDisplayValues()[0]
      .map(function(value) {
        return cleanString(value).toLowerCase();
      });

    const hasLynkHeaders =
      headers[CONFIG.PURCHASE_DATE_COLUMN - 1] === 'tanggal' &&
      headers[CONFIG.ORDER_STATUS_COLUMN - 1] === 'status' &&
      headers[CONFIG.BUYER_EMAIL_COLUMN - 1] === 'buyer email';

    if (hasLynkHeaders) {
      return sheet;
    }
  }

  throw new Error('Tab transaksi Lynk tidak ditemukan. Periksa SHEET_NAME.');
}

const ACCESS_HEADERS = [
  'Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date',
  'AU Expiration Date', 'AU Status Account', 'AU Device Handphone',
  'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID'
];

function getAccessSheet() {
  if (CONFIG.ACCESS_SPREADSHEET_ID === CONFIG.SPREADSHEET_ID) {
    throw new Error('Spreadsheet akses harus terpisah dari spreadsheet Lynk.');
  }
  const spreadsheet = SpreadsheetApp.openById(CONFIG.ACCESS_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.ACCESS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Tab AU Access tidak ditemukan di spreadsheet akses.');
  }
  if (sheet.getLastRow() > 0) {
    const headers = sheet.getRange(1, 1, 1, ACCESS_HEADERS.length).getDisplayValues()[0];
    ACCESS_HEADERS.forEach(function(header, index) {
      if (cleanString(headers[index]) !== header) {
        throw new Error('Header AU Access tidak sesuai pada kolom ' + (index + 1));
      }
    });
  }
  return sheet;
}

function withAccessLock(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    // Flush writes before another execution reads or registers a device.
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

// Ref identifies the transaction, not its mutable row position in Lynk.
// Existing AU Access rows are authoritative, even when legacy AA:AF vanish.
function getAccessRecord(buyer, create) {
  const source = buyer.row;
  const email = normalizeEmail(source[CONFIG.BUYER_EMAIL_COLUMN - 1]);
  const ref = cleanString(source[CONFIG.TRANSACTION_REF_COLUMN - 1]);
  if (!email || !ref) {
    throw new Error('Transaksi tidak memiliki Buyer Email atau Ref.');
  }
  const sheet = getAccessSheet();
  const count = Math.max(0, sheet.getLastRow() - 1);
  const rows = count ? sheet.getRange(2, 1, count, ACCESS_HEADERS.length).getValues() : [];
  let match = null;
  rows.forEach(function(row, index) {
    if (cleanString(row[CONFIG.ACCESS_REF_COLUMN - 1]) !== ref) return;
    if (normalizeEmail(row[CONFIG.ACCESS_EMAIL_COLUMN - 1]) !== email || match) {
      throw new Error('Ref duplikat atau email transaksi tidak sesuai di AU Access.');
    }
    const timezone = sheet.getParent().getSpreadsheetTimeZone();
    const calendarRow = row.slice();
    calendarRow[CONFIG.ACCESS_PURCHASE_DATE_COLUMN - 1] = calendarDateText(
      row[CONFIG.ACCESS_PURCHASE_DATE_COLUMN - 1], timezone, true
    );
    calendarRow[CONFIG.EXPIRATION_DATE_COLUMN - 1] = calendarDateText(
      row[CONFIG.EXPIRATION_DATE_COLUMN - 1], timezone, false
    );
    match = { sheet: sheet, rowNumber: index + 2, row: calendarRow };
  });
  if (match) return match;

  // Bootstrap only missing records. Never merge legacy blanks over saved state.
  const sourceTimezone = getMainSheet().getParent().getSpreadsheetTimeZone();
  const row = [email, ref, getBuyerName(source), calendarDateText(
    source[CONFIG.PURCHASE_DATE_COLUMN - 1], sourceTimezone, true
  )];
  for (let i = 26; i < 32; i++) {
    row.push(source[i] === undefined || source[i] === null ? '' : source[i]);
  }
  row[CONFIG.EXPIRATION_DATE_COLUMN - 1] = calendarDateText(source[26], sourceTimezone, false);
  if (!create || !normalizeDate(row[CONFIG.ACCESS_PURCHASE_DATE_COLUMN - 1])) {
    return { sheet: sheet, rowNumber: null, row: row };
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ACCESS_HEADERS.length).setValues([ACCESS_HEADERS]);
  }
  const rowNumber = sheet.getLastRow() + 1;
  // Treat buyer-supplied text as data, never as spreadsheet formulas.
  const values = row.map(function(value) {
    return typeof value === 'string' && /^\s*=/.test(value) ? "'" + value : value;
  });
  sheet.getRange(rowNumber, CONFIG.ACCESS_PURCHASE_DATE_COLUMN, 1, 2)
    .setNumberFormat('@');
  sheet.getRange(rowNumber, 1, 1, row.length).setValues([values]);
  return { sheet: sheet, rowNumber: rowNumber, row: row };
}

/*****************************************************
 * BUYER NAME — LYNK COLUMN R
 *****************************************************/
function getBuyerName(row) {
  return cleanString(
    row[CONFIG.BUYER_NAME_COLUMN - 1]
  );
}

/*****************************************************
 * OPTIONAL HEADER SETUP
 *****************************************************/
function setupTechnicalHeaders() {
  return withAccessLock(function() {
    const sheet = getAccessSheet();
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, ACCESS_HEADERS.length).setValues([ACCESS_HEADERS]);
    }
  });
}

// Editor-only migration: imports surviving legacy data, never overwrites access rows.
function migrateLegacyAccessData() {
  const result = updateAllSubscriptions();
  console.log('Access migration summary: ' + JSON.stringify(result));
  if (result.failed || result.invalid) {
    throw new Error('Migrasi belum lengkap. Periksa log dan data transaksi sebelum deployment.');
  }
  return result;
}

function calendarDateText(value, timezone, includeTime) {
  if (Object.prototype.toString.call(value) !== '[object Date]' || isNaN(value.getTime())) {
    return value === undefined || value === null ? '' : value;
  }
  return Utilities.formatDate(value, timezone, includeTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy');
}

// Editor-only, read-only preview. Never exposed through doPost.
function previewLegacyDateAlignment() {
  const result = buildLegacyDateAlignment();
  console.log('Legacy date alignment preview: ' + JSON.stringify(result));
  return result;
}

function buildLegacyDateAlignment() {
  const source = getMainSheet();
  const access = getAccessSheet();
  const sourceTimezone = source.getParent().getSpreadsheetTimeZone();
  const accessTimezone = access.getParent().getSpreadsheetTimeZone();
  const sourceRows = source.getLastRow() < 2 ? [] : source.getRange(
    2, 1, source.getLastRow() - 1, Math.max(source.getLastColumn(), CONFIG.TRANSACTION_REF_COLUMN)
  ).getValues();
  const accessRows = access.getLastRow() < 2 ? [] : access.getRange(
    2, 1, access.getLastRow() - 1, ACCESS_HEADERS.length
  ).getValues();
  const transactions = Object.create(null);
  sourceRows.forEach(function(row) {
    if (normalizeOrderStatus(row[CONFIG.ORDER_STATUS_COLUMN - 1]) !== CONFIG.SUCCESS_ORDER_STATUS) return;
    const ref = cleanString(row[CONFIG.TRANSACTION_REF_COLUMN - 1]);
    if (!ref) return;
    if (transactions[ref]) throw new Error('Ref transaksi Lynk duplikat. Periksa data sebelum koreksi.');
    transactions[ref] = row;
  });
  const result = { sourceTimezone: sourceTimezone, accessTimezone: accessTimezone, changes: [], skipped: [] };
  const seen = Object.create(null);
  accessRows.forEach(function(row, index) {
    const ref = cleanString(row[CONFIG.ACCESS_REF_COLUMN - 1]);
    if (seen[ref]) throw new Error('Ref AU Access duplikat. Periksa data sebelum koreksi.');
    seen[ref] = true;
    const legacy = transactions[ref];
    if (!legacy || normalizeEmail(legacy[CONFIG.BUYER_EMAIL_COLUMN - 1]) !== normalizeEmail(row[0])) return;
    [
      [CONFIG.ACCESS_PURCHASE_DATE_COLUMN, CONFIG.PURCHASE_DATE_COLUMN - 1, true],
      [CONFIG.EXPIRATION_DATE_COLUMN, 26, false]
    ].forEach(function(mapping) {
      const column = mapping[0];
      const oldValue = legacy[mapping[1]];
      const currentValue = row[column - 1];
      if (Object.prototype.toString.call(oldValue) !== '[object Date]' || isNaN(oldValue.getTime())) return;
      const desired = calendarDateText(oldValue, sourceTimezone, mapping[2]);
      const displayed = calendarDateText(currentValue, accessTimezone, mapping[2]);
      if (displayed === desired) return;
      // Only repair unchanged raw timestamps copied by 3.4, never manual edits.
      if (Object.prototype.toString.call(currentValue) !== '[object Date]' ||
          isNaN(currentValue.getTime()) || Math.abs(currentValue.getTime() - oldValue.getTime()) > 1000) {
        result.skipped.push({ rowNumber: index + 2, column: column, ref: ref, reason: 'VALUE_CHANGED_REVIEW_MANUALLY' });
        return;
      }
      result.changes.push({ rowNumber: index + 2, column: column, ref: ref, from: displayed, to: desired });
    });
  });
  return result;
}

// Run only after reviewing the preview and backing up AU Access.
function alignLegacyDatesToSource() {
  return withAccessLock(function() {
    const plan = buildLegacyDateAlignment();
    const sheet = getAccessSheet();
    plan.changes.forEach(function(change) {
      sheet.getRange(change.rowNumber, change.column).setNumberFormat('@').setValue(change.to);
    });
    console.log('Legacy date alignment applied: ' + JSON.stringify(plan));
    return plan;
  });
}

/*****************************************************
 * MANUAL TEST — SPREADSHEET CONNECTION
 *****************************************************/
function testSpreadsheetConnection() {
  const sheet = getMainSheet();

  Logger.log('Connected to sheet: ' + sheet.getName());
  Logger.log('Rows: ' + sheet.getLastRow());
  Logger.log('Columns: ' + sheet.getLastColumn());
  const access = getAccessSheet();
  Logger.log('Access sheet: ' + access.getName());
  Logger.log('Access rows: ' + access.getLastRow());
}

/*****************************************************
 * HELPERS
 *****************************************************/
function deny(reason) {
  return {
    success: false,
    accessGranted: false,
    reason: reason
  };
}

function normalizeOrderStatus(value) {
  return cleanString(value).toUpperCase();
}

function normalizeAccountStatus(value) {
  const status = cleanString(value).toLowerCase();

  if (status === 'inactive') {
    return CONFIG.INACTIVE_STATUS;
  }

  if (status === 'expired') {
    return CONFIG.EXPIRED_STATUS;
  }

  if (status === 'active') {
    return CONFIG.ACTIVE_STATUS;
  }

  return '';
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizeDeviceType(value) {
  const type = cleanString(value).toLowerCase();

  if (
    type === 'mobile' ||
    type === 'handphone' ||
    type === 'phone' ||
    type === 'smartphone'
  ) {
    return 'mobile';
  }

  if (
    type === 'desktop' ||
    type === 'laptop' ||
    type === 'computer'
  ) {
    return 'desktop';
  }

  return null;
}

function isUsableDeviceId(deviceId) {
  const value = cleanString(deviceId);

  if (!value) {
    return false;
  }

  const blocked = [
    'mobile_device',
    'desktop_device',
    'temp_device_node'
  ];

  return blocked.indexOf(value.toLowerCase()) === -1;
}

function sanitizeDeviceLabel(value, deviceType) {
  let label = cleanString(value);

  if (!label) {
    return defaultDeviceLabel(deviceType);
  }

  // Prevent raw technical IDs being shown in device-label columns.
  if (label.indexOf('dev_') === 0) {
    return defaultDeviceLabel(deviceType);
  }

  if (label.length > 80) {
    label = label.substring(0, 80);
  }

  return label;
}

function defaultDeviceLabel(deviceType) {
  return deviceType === 'mobile'
    ? 'Mobile Device'
    : 'Desktop / Laptop';
}

function decodeLegacyDevice(value) {
  const text = cleanString(value);

  if (text.indexOf(' || ') === -1) {
    return {
      deviceId: '',
      deviceLabel: text
    };
  }

  const parts = text.split(' || ');

  return {
    deviceId: cleanString(parts.shift()),
    deviceLabel: cleanString(parts.join(' || '))
  };
}

function isBlankValue(value) {
  return value === null ||
    value === undefined ||
    cleanString(value) === '';
}

/*****************************************************
 * DATE PARSER
 *****************************************************/
function normalizeDate(value) {
  if (
    Object.prototype.toString.call(value) ===
    '[object Date]'
  ) {
    if (!isNaN(value.getTime())) {
      return new Date(value.getTime());
    }
  }

  const text = cleanString(value);

  if (!text) {
    return null;
  }

  // DD-MM-YYYY / DD/MM/YYYY, optional HH:mm
  const match = text.match(
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;

    const parsed = new Date(
      year,
      month,
      day,
      hour,
      minute,
      0,
      0
    );

    // Reject overflow dates such as 31/02/2026.
    if (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    ) {
      return parsed;
    }

    return null;
  }

  // ISO/fallback
  const fallback = new Date(text);

  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function addCalendarDays(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function getTodayInTimezone() {
  const value = Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyy-MM-dd'
  );

  const parts = value.split('-');

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    0,
    0,
    0,
    0
  );
}

function toDateOnly(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function formatDate(date) {
  if (!date) {
    return null;
  }

  // These are calendar dates already normalized to the source sheet, not instants.
  return padDatePart(date.getDate()) + '-' + padDatePart(date.getMonth() + 1) + '-' + date.getFullYear();
}

function formatDateTime(date) {
  if (!date) {
    return null;
  }

  return formatDate(date) + ' ' + padDatePart(date.getHours()) + ':' + padDatePart(date.getMinutes());
}

function padDatePart(value) {
  return value < 10 ? '0' + value : String(value);
}

function cleanString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function safeErrorMessage(error) {
  if (!error) {
    return 'Unknown error';
  }

  return cleanString(error.message || error);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
