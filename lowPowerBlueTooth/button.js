// document.write("<div class='swatches' >",
//         "<button class='onoff' data-value='onoff'>onoff</button>",
//      "</div >"
// )
// var operate_div = document.getElementById('operateDiv');
// var input_ly = document.createElement("input");
// input_ly.type = "button";
// input_ly.setAttribute("class", "button");
// input_ly.setAttribute("value", "导出缺陷模板");
// input_ly.addEventListener("click", exportEntityTemLinYang);
// input_ly.setAttribute("left", "12px");
// input_ly.setAttribute("font-size", "13px");
// input_ly.setAttribute("height", "22px");
// operate_div.appendChild(input_ly);

var view = document.getElementById('universalView');
var swatch = document.createElement("div");
swatch.setAttribute("class", "swatches");

{
    var btn = document.createElement("BUTTON");
    btn.setAttribute("class", "onoff");
    btn.setAttribute("data-value", "onoff");
    btn.textContent = "onoff";
    swatch.appendChild(btn);

    var btn = document.createElement("BUTTON");
    btn.setAttribute("class", "red tea");
    btn.setAttribute("data-value", "330101");
    btn.textContent = "红茶";
    swatch.appendChild(btn);

    var btn = document.createElement("BUTTON");
    btn.setAttribute("class", "green tea");
    btn.setAttribute("data-value", "330100");
    btn.textContent = "绿茶";
    swatch.appendChild(btn);
}

view.appendChild(swatch);