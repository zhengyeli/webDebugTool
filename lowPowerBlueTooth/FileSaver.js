function save_record(filename, content) {
  //打开新窗口保存
  var winRecord = window.open('about:blank', '_blank', 'top=500');
  winRecord.document.open("text/html", "utf-8");
  winRecord.document.write(" <div class=\"introBox section package boxBg02\" id=\"yhtcprediv\">" + content + "</div>");
  winRecord.document.execCommand("SaveAs", true, filename + ".html");
  winRecord.close();
}