// =============================================
// DASHBOARD CARNAVAL 2026 — APPS SCRIPT API
// =============================================
// Cole este codigo em: Extensoes > Apps Script
// Deploy: Implantar > Nova implantacao > App da Web
//   Executar como: Eu
//   Quem tem acesso: Qualquer pessoa
// Copie a URL e passe como parametro: ?api=URL

function doGet(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(err) {
    return resp({ok:false, error:'servidor ocupado'});
  }
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Status');
    if (!sheet) return resp({ok:false, error:'Aba Status nao encontrada'});
    var p = e.parameter;
    var data = sheet.getDataRange().getValues();
    var hora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'HH:mm');

    // Batch: ?batch=APREV_24_EM_TRANSITO,APREV_25_EM_TRANSITO
    if (p.batch) {
      var items = p.batch.split(',');
      var count = 0;
      items.forEach(function(item) {
        var parts = item.split('_');
        if (parts.length >= 3) {
          var tipo = parts[0], num = parts[1], status = parts.slice(2).join('_');
          var row = findRow(data, tipo, num);
          if (row > 0) {
            sheet.getRange(row, 7).setValue(status);
            sheet.getRange(row, 8).setValue(hora);
            data[row-1][6] = status;
            count++;
          }
        }
      });
      return resp({ok:true, count:count});
    }

    // Single: ?tipo=APREV&num=24&status=IMPLANTADO
    if (p.tipo && p.num && p.status) {
      var row = findRow(data, p.tipo, p.num);
      if (row > 0) {
        sheet.getRange(row, 7).setValue(p.status);
        sheet.getRange(row, 8).setValue(hora);
        return resp({ok:true});
      }
      return resp({ok:false, error:'Ponto nao encontrado: '+p.tipo+' '+p.num});
    }

    return resp({ok:false, error:'Use: ?tipo=APREV&num=01&status=IMPLANTADO'});
  } finally { lock.releaseLock(); }
}

function findRow(data, tipo, num) {
  num = String(num);
  if (num.length === 1) num = '0' + num;
  for (var i = 1; i < data.length; i++) {
    var rn = String(data[i][1]);
    if (rn.length === 1) rn = '0' + rn;
    if (data[i][0] === tipo && rn === num) return i + 1;
  }
  return 0;
}

function resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
