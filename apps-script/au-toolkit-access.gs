/*****************************************************
 * AU TOOLKIT PRO
 * BUYER ACCESS + SUBSCRIPTION + DEVICE LOCK BACKEND
 *
 * AU Access spreadsheet: 1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ
 * A = login email, B = transaction Ref, C = buyer name, D = purchase date
 * E = expiration, F = account status, G/H = device labels, I/J = device IDs
 * K = source spreadsheet ID, L = purchase route
 *
 * Lynk spreadsheet: 1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88
 * Sheet AU Toolkit PRO supplies Ref, Status and Tanggal (read only).
 * Email corrections and device state stay in AU Access, linked by Ref.
 *****************************************************/

const CONFIG = {
  VERSION: '3.6-append-only-buyer-sync',
  SPREADSHEET_ID: '1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ',
  SHEET_NAME: 'AU Access',
  ORDER_SPREADSHEET_ID: '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88',
  ORDER_SHEET_NAME: 'AU Toolkit PRO',
  ORDER_SOURCES: {
    '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88': 'AU Toolkit PRO',
    '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ': 'Fast Track'
  },

  PURCHASE_DATE_COLUMN: 4,         // D = Purchase Date
  ORDER_STATUS_COLUMN: 13,         // Virtual column: read from Lynk by Ref, never written
  BUYER_EMAIL_COLUMN: 1,           // A = Login email, maintained in AU Access
  BUYER_NAME_COLUMN: 3,            // C = Buyer Name
  ORDER_REF_COLUMN: 2,             // B = Ref
  TRANSACTION_SOURCE_COLUMN: 11,   // K = Transaction Source

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
  let selectedSheetName = null;
  try {
    selectedSheetName = getMainSheet().getName();
  } catch (error) {
    selectedSheetName = 'ERROR: ' + safeErrorMessage(error);
  }

  return jsonResponse({
    success: true,
    service: 'AU Toolkit Access API',
    status: 'online',
    version: CONFIG.VERSION,
    configuredSheetName: CONFIG.SHEET_NAME,
    selectedSheetName: selectedSheetName
  });
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
        let selectedSheetName = null;
        try {
          selectedSheetName = getMainSheet().getName();
        } catch (error) {
          selectedSheetName = 'ERROR: ' + safeErrorMessage(error);
        }

        return jsonResponse({
          success: true,
          service: 'AU Toolkit Access API',
          status: 'online',
          version: CONFIG.VERSION,
          configuredSheetName: CONFIG.SHEET_NAME,
          selectedSheetName: selectedSheetName
        });

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
 * Used before Google popup so unknown emails do not create
 * Firebase Auth accounts. This intentionally does not write
 * subscription, status, or device cells.
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
  const purchaseDate = normalizeDate(row[CONFIG.PURCHASE_DATE_COLUMN - 1]);
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

  const manualStatus = normalizeAccountStatus(row[CONFIG.STATUS_ACCOUNT_COLUMN - 1]);
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
  let expirationDate = normalizeDate(row[CONFIG.EXPIRATION_DATE_COLUMN - 1]);
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
  const rowNumber = buyer.rowNumber;
  const row = buyer.row;

  const subscription = ensureSubscriptionData(sheet, rowNumber, row);

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
    sheet,
    rowNumber,
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

  // Payment data is read-only; only AU Access receives account/device writes.
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
 * - Search ALL AU Access rows matching A (login email)
 * - Only the linked Lynk transaction with Status = SUCCESS is eligible
 * - If multiple SUCCESS rows exist, choose the newest
 *   valid purchase date from Lynk
 *****************************************************/
function findLatestSuccessfulBuyer(sheet, targetEmail) {
  let emailFound = false;
  const successfulRows = [];
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { emailFound: false, buyer: null };
  }

  const rowCount = lastRow - 1;
  const rows = getAccessRows(sheet, targetEmail);

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
 * D = purchase date supplied by the linked transaction
 * E = expiration date, F = account status in AU Access
 *
 * Rules:
 * 1. If E is blank -> E = purchase date + 30 days
 * 2. Preserve valid manual expiration dates; reject invalid dates
 * 3. Preserve manual Inactive and Expired
 * 4. Expire automatically when the expiration date is reached
 * 5. Manual renewal = future E + Active F
 *****************************************************/
function ensureSubscriptionData(sheet, rowNumber, row) {
  const purchaseRaw = row[CONFIG.PURCHASE_DATE_COLUMN - 1];
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
      .setValue(expirationDate)
      .setNumberFormat('dd-MM-yyyy');
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

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const labelCell = sheet.getRange(rowNumber, labelColumn);
    const idCell = sheet.getRange(rowNumber, idColumn);

    let registeredLabel = cleanString(labelCell.getDisplayValue());
    let registeredId = cleanString(idCell.getDisplayValue());

    // Migrate old combined format from R/S:
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

    // Accept an old browser suffix only when the full slot and hardware hash match.
    if (normalizeDeviceSignature(registeredId) === normalizeDeviceSignature(deviceId)) {
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
  } finally {
    lock.releaseLock();
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

  if (lastRow < 2) {
    return;
  }

  const rows = getAccessRows(sheet);

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
      ensureSubscriptionData(sheet, rowNumber, row);
    } catch (error) {
      console.error(
        'Subscription update failed at row ' +
          rowNumber +
          ': ' +
          safeErrorMessage(error)
      );
    }
  });
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

  const result = ensureSubscriptionData(
    sheet,
    buyerSelection.buyer.rowNumber,
    buyerSelection.buyer.row
  );

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

  throw new Error('Sheet AU Access tidak ditemukan.');
}

// Login identity and device state belong to AU Access; Lynk owns payment data.
// Join by transaction Ref so an email correction survives source refreshes.
function getAccessRows(sheet, targetEmail) {
  validateAccessHeaders(sheet);
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const ordersBySource = new Map();
  return rows.map(function(row) {
    const ref = cleanString(row[CONFIG.ORDER_REF_COLUMN - 1]);
    const source = cleanString(row[CONFIG.TRANSACTION_SOURCE_COLUMN - 1]);
    const relevant = !targetEmail || normalizeEmail(row[CONFIG.BUYER_EMAIL_COLUMN - 1]) === targetEmail;
    let order = null;
    if (relevant && Object.prototype.hasOwnProperty.call(CONFIG.ORDER_SOURCES, source)) {
      if (!ordersBySource.has(source)) {
        ordersBySource.set(source, getOrdersByRef(source, CONFIG.ORDER_SOURCES[source]));
      }
      order = ordersBySource.get(source).get(ref);
    }
    row[CONFIG.ORDER_STATUS_COLUMN - 1] = order ? order.status : '';
    row[CONFIG.PURCHASE_DATE_COLUMN - 1] = order ? order.purchaseDate : '';
    return row;
  });
}

function validateAccessHeaders(sheet) {
  const header = sheet.getRange(1, 1, 1, 12).getValues()[0];
  const expected = ['Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date',
    'AU Expiration Date', 'AU Status Account', 'AU Device Handphone',
    'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID', 'Transaction Source'];
  expected.forEach(function(name, index) {
    if (cleanString(header[index]).toLowerCase() !== name.toLowerCase()) {
      throw new Error('Kolom AU Access tidak sesuai: ' + name);
    }
  });
}

function getOrdersByRef(sourceId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(sourceId);
  // Lynk's Fast Track tab currently has a trailing space in its name.
  const orderSheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.getSheets().find(function(sheet) {
    return cleanString(sheet.getName()) === sheetName;
  });
  if (!orderSheet) throw new Error('Sheet pembelian Lynk tidak ditemukan.');
  const orders = orderSheet.getDataRange().getValues();
  const orderHeaders = orders[0].map(function(value) {
    return cleanString(value).toLowerCase();
  });
  const refIndex = orderHeaders.indexOf('ref');
  const statusIndex = orderHeaders.indexOf('status');
  const dateIndex = orderHeaders.indexOf('tanggal');
  const emailIndex = orderHeaders.indexOf('buyer email');
  const nameIndex = orderHeaders.indexOf('buyer name (opsional)');
  if (refIndex < 0 || statusIndex < 0 || dateIndex < 0) {
    throw new Error('Kolom Ref, Status, atau Tanggal Lynk tidak ditemukan.');
  }
  const byRef = new Map();
  orders.slice(1).forEach(function(order) {
    const ref = cleanString(order[refIndex]);
    if (!ref) return;
    if (byRef.has(ref)) throw new Error('Ref transaksi Lynk duplikat.');
    byRef.set(ref, {
      status: order[statusIndex], purchaseDate: order[dateIndex],
      email: emailIndex < 0 ? '' : normalizeEmail(order[emailIndex]),
      buyerName: nameIndex < 0 ? '' : cleanString(order[nameIndex])
    });
  });
  return byRef;
}

// Existing rows are never rewritten: admin email corrections and device locks survive.
function syncBuyerAccess() {
  return syncBuyerAccessInternal(false);
}

function previewBuyerAccessSync() {
  return syncBuyerAccessInternal(true);
}

function syncBuyerAccessInternal(dryRun) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getMainSheet();
    validateAccessHeaders(sheet);
    const lastRow = sheet.getLastRow();
    const existing = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    const known = new Set(existing.map(function(row) {
      return cleanString(row[10]) + '|' + cleanString(row[1]);
    }));
    const pending = [];
    const result = { dryRun: dryRun, added: 0, alreadyPresent: 0, skipped: 0 };
    const today = toDateOnly(getTodayInTimezone());
    Object.keys(CONFIG.ORDER_SOURCES).forEach(function(sourceId) {
      const orders = getOrdersByRef(sourceId, CONFIG.ORDER_SOURCES[sourceId]);
      orders.forEach(function(order, ref) {
        const key = sourceId + '|' + ref;
        if (known.has(key)) {
          result.alreadyPresent++;
          return;
        }
        const date = normalizeDate(order.purchaseDate);
        if (normalizeOrderStatus(order.status) !== CONFIG.SUCCESS_ORDER_STATUS ||
            !date || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
          result.skipped++;
          return;
        }
        const expiration = addCalendarDays(date, CONFIG.SUBSCRIPTION_DAYS);
        const status = toDateOnly(expiration).getTime() <= today.getTime()
          ? CONFIG.EXPIRED_STATUS : CONFIG.ACTIVE_STATUS;
        const safeText = function(value) { return value.charAt(0) === '=' ? "'" + value : value; };
        pending.push([safeText(order.email), ref, safeText(order.buyerName), date,
          expiration, status, '', '', '', '', sourceId,
          sourceId === CONFIG.ORDER_SPREADSHEET_ID ? 'Reguler' : 'Fast Track']);
        known.add(key);
      });
    });
    if (!dryRun && pending.length) {
      const requiredRows = lastRow + pending.length;
      if (requiredRows > sheet.getMaxRows()) {
        sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
      }
      sheet.getRange(lastRow + 1, 1, pending.length, 12).setValues(pending);
      sheet.getRange(lastRow + 1, 4, pending.length, 1).setNumberFormat('dd-MM-yyyy HH:mm');
      sheet.getRange(lastRow + 1, 5, pending.length, 1).setNumberFormat('dd-MM-yyyy');
      SpreadsheetApp.flush();
    }
    result.added = pending.length;
    console.log('AU Access sync: ' + JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function createBuyerAccessSyncTrigger() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const exists = ScriptApp.getProjectTriggers().some(function(trigger) {
      return trigger.getHandlerFunction() === 'syncBuyerAccess';
    });
    if (!exists) ScriptApp.newTrigger('syncBuyerAccess').timeBased().everyMinutes(5).create();
  } finally {
    lock.releaseLock();
  }
}

/*****************************************************
 * BUYER NAME — AU ACCESS COLUMN C
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
  const sheet = getMainSheet();

  const headers = [
    [CONFIG.EXPIRATION_DATE_COLUMN, 'AU Expiration Date'],
    [CONFIG.STATUS_ACCOUNT_COLUMN, 'AU Status Account'],
    [CONFIG.DEVICE_MOBILE_LABEL_COLUMN, 'AU Device Handphone'],
    [CONFIG.DEVICE_DESKTOP_LABEL_COLUMN, 'AU Device Laptop'],
    [CONFIG.DEVICE_MOBILE_ID_COLUMN, 'Mobile Device ID'],
    [CONFIG.DEVICE_DESKTOP_ID_COLUMN, 'Laptop Device ID']
  ];

  headers.forEach(function(item) {
    const cell = sheet.getRange(1, item[0]);
    if (!cleanString(cell.getValue())) {
      cell.setValue(item[1]);
    }
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

function normalizeDeviceSignature(value) {
  const id = cleanString(value).split('||')[0].trim();
  const match = id.match(/^dev_(mobile|desktop)_hw_([a-f0-9]{6,16})(?:_[a-z0-9-]+)?$/i);
  return match ? 'dev_' + match[1].toLowerCase() + '_hw_' + match[2].toLowerCase() : id;
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

  // Prevent raw technical IDs being shown in R/S.
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

  return Utilities.formatDate(
    date,
    CONFIG.TIMEZONE,
    'dd-MM-yyyy'
  );
}

function formatDateTime(date) {
  if (!date) {
    return null;
  }

  return Utilities.formatDate(
    date,
    CONFIG.TIMEZONE,
    'dd-MM-yyyy HH:mm'
  );
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
