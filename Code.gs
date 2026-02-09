function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch(err) {
    return resp({ok:false, error:"servidor ocupado"});
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Status");
    if (!sheet) return resp({ok:false, error:"Aba Status nao encontrada"});

    var p = e.parameter;
    var data = sheet.getDataRange().getValues();
    var hora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "HH:mm");

    if (p.batch) {
      var items = p.batch.split(",");
      var count = 0;
      for (var j = 0; j < items.length; j++) {
        var parts = items[j].split("_");
        if (parts.length >= 3) {
          var tipo = parts[0];
          var num = parts[1];
          var st = parts.slice(2).join("_");
          var row = findRow(data, tipo, num);
          if (row > 0) {
            sheet.getRange(row, 7).setValue(st);
            sheet.getRange(row, 8).setValue(hora);
            count++;
          }
        }
      }
      return resp({ok:true, count:count});
    }

    if (p.tipo && p.num && p.status) {
      var row2 = findRow(data, p.tipo, p.num);
      if (row2 > 0) {
        sheet.getRange(row2, 7).setValue(p.status);
        sheet.getRange(row2, 8).setValue(hora);
        return resp({ok:true});
      }
      return resp({ok:false, error:"Ponto nao encontrado"});
    }

    return resp({ok:false, error:"Parametros ausentes"});
  } finally {
    lock.releaseLock();
  }
}

function findRow(data, tipo, num) {
  num = String(num);
  if (num.length === 1) num = "0" + num;
  for (var i = 1; i < data.length; i++) {
    var rn = String(data[i][1]);
    if (rn.length === 1) rn = "0" + rn;
    if (data[i][0] === tipo && rn === num) return i + 1;
  }
  return 0;
}

function resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
