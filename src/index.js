import "./style.css";

import json from "../db.json";
import config from "../config.json";
import params from "../params.json";

import Lodash from "lodash";
import _ from "underscore";
import {sort} from "fast-sort"

let headerData = getHeaderData();
let headerHTML = renderHeaderHTML(headerData);
loadHTML(headerHTML, ".iksweb", "afterbegin");
main();
loadHTML(renderOptions(), ".iksweb", "afterend");

const inputBtn = document.querySelector(".btn");
const inputText = document.querySelector(".text");
const inputTextBy = document.querySelector(".textBy");
const headerRow = document.querySelector(".headerRow")

function getKeysInsteadLabel(label) {
    return config.filter(function (item) {
        return item.label == label
    })
}

const bodyElem = document.querySelector("body")
headerRow.addEventListener("click", function (e) {
    if (e.target.dataset.sort == "sort") {
        const ikswebElem = document.querySelector(".table-wrapper")
        ikswebElem.textContent = ""
        let howSort = e.target.classList[e.target.classList.length - 1]
        let bySort = getKeysInsteadLabel(e.target.dataset.value)[0].key
        main({howSort: howSort, bySort: bySort})
        if (howSort == "asc") {
          e.target.classList.remove("asc");
          e.target.classList.add("desc");
        } else {
          e.target.classList.remove("desc");
          e.target.classList.add("asc");
        }
    }
})

inputBtn.addEventListener("click", function (e) {
    const ikswebElem = document.querySelector(".table-wrapper");
    ikswebElem.textContent = ``;
    const inputValueText = inputText.value;
    const inputValueTextBy = inputTextBy.value;
    main({condition: inputValueText, by: inputValueTextBy})
});

function findAllByCondition(jsonArr, condition) {
    return _.pluck(jsonArr, condition);
}

function aggrBy(jsonArr, condition) {
    function max() {
        return Math.max.apply(this, jsonArr);
    }

    function min() {
        return Math.min.apply(this, jsonArr);
    }

    function count() {
        return jsonArr.length;
    }

    function avg() {
        return Math.max.apply(this, jsonArr) / count();
    }

    function sum() {
        return Lodash.sum(jsonArr);
    }

    if (condition == "max") {
        return max();
    }
    if (condition == "min") {
        return min();
    }
    if (condition == "count") {
        return count();
    }
    if (condition == "avg") {
        return avg();
    }
    if (condition == "sum") {
        return sum();
    }
}

function getKeysFromConfig() {
    return findAllByCondition(config, "key");
}

function getGroupsLength(startSubSplitter, flag = false) {
    if (flag) {
        return Lodash.uniq(_.pluck(json, startSubSplitter));
    }
    return Lodash.uniq(_.pluck(json, startSubSplitter)).length;
}

function canSumElems() {
    return params.sum;
}

function main(obj = {condition: "sum", by: "value", howSort: "asc", bySort: "value"}) {
    let [mainSplitter, startSubSplitter, endSubSplitter] = getKeysFromConfig();
    filterItems(mainSplitter, startSubSplitter, endSubSplitter, obj.condition, obj.by, obj.howSort, obj.bySort);
}

function groupBy(jsonArr, conditionStr, flag = false) {
    if (flag) {
        return Object.values(_.groupBy(jsonArr, conditionStr));
    }
    return _.groupBy(jsonArr, conditionStr);
}

function isLeftKeys(count) {
    return count == getKeysFromConfig().length;
}

function filterItemsByCondition(mainSplitter, condition, by, group = false) {
    let duplicatedArr = [];
    let obj = {};
    let keysFromConfig = getKeysFromConfig();
    let arrItemsByConfig = getItemsByCondition(json, keysFromConfig);
    if (group) {
        let arrGroupped = groupBy(arrItemsByConfig, mainSplitter, true);
        for (let arrElem of arrGroupped) {
            obj = {...arrElem[0]};
            sumObj(obj, arrElem, condition, by);
            duplicatedArr.push(obj);
        }
        loadHTML(renderHTML(duplicatedArr), ".table-wrapper", "afterbegin");
        duplicatedArr = [];
        obj = {};
        return;
    }
    if (!group) {
        for (let item of arrItemsByConfig) {
            obj = {...item};
            sumObj(obj, item, condition, by);
        }
        duplicatedArr.push(obj);
        loadHTML(renderHTML(duplicatedArr), ".table-wrapper", "afterbegin");
        duplicatedArr = [];
        obj = {};
        return;
    }
}

function filterItems(
    mainSplitter,
    startSplitter,
    endSplitter,
    condition = "sum",
    by = "value",
    howSort,
    bySort
) {
    let countKeys = getKeysFromConfig().length;
    if (isLeftKeys(2)) {
        filterItemsByCondition(mainSplitter, condition, by, true);
    }
    if (isLeftKeys(1)) {
        filterItemsByCondition(mainSplitter, condition, by);
    }
    let keysFromConfig = getKeysFromConfig();
    console.log(bySort, howSort)
    let arrItemsByConfig = getItemsByCondition(json, keysFromConfig);
    arrItemsByConfig = sortByStr(arrItemsByConfig, bySort, howSort)
    let arr = [];
    let duplicatedArr = [];
    let obj = {};
    let arrGrouppedByRegion = groupBy(arrItemsByConfig, mainSplitter, true);
    console.log(arrGrouppedByRegion, "groupped")
    for (let arrElems of arrGrouppedByRegion) {
        for (let i = 0; i < arrElems.length; i++) {
            let grouppedByEndSplitter = groupBy(arrElems, endSplitter, true);
            for (let arrElem of grouppedByEndSplitter) {
                let grouppedByStartSplitter = groupBy(arrElem, startSplitter, true);
                for (let elem of grouppedByStartSplitter) {
                    obj = {...elem[0]};
                    sumObj(obj, elem, condition, by);
                    duplicatedArr.push(obj);
                }
            }
            if (i == arrElems.length - 1) {
                let count = countObjProps(duplicatedArr[0]);
                let condition;
                if (count <= 3) {
                    condition = mainSplitter;
                } else if (count >= 4) {
                    condition = startSplitter;
                }
                duplicatedArr = sortByStr(duplicatedArr, bySort, howSort)
                console.log(duplicatedArr, "duplicated")
                let result = Lodash.sortBy(
                    Lodash.uniqWith(duplicatedArr, _.isEqual),
                    condition
                );
                let lengthElems = result.length;
                // let mainSplitterId = result[0].region;
                // result = sortByStr(result, bySort, howSort)
                result = groupBy(result, condition, true);
                loadHTML(
                    renderDataHTML(
                        result,
                        mainSplitter,
                        mainSplitter,
                        startSplitter,
                        endSplitter,
                        lengthElems
                    ),
                    ".table-wrapper",
                    "afterbegin"
                );
                duplicatedArr = [];
            }
        }
    }
}

function getItemsByCondition(jsonArr, arrConditionStr) {
    return jsonArr.map(function (item) {
        return _.pick(item, arrConditionStr);
    });
}

function sumObj(obj, arr, condition, by = "value") {
    for (let item of canSumElems()) {
        for (let key in obj) {
            if (key == item) {
                obj[key] = aggrBy(findAllByCondition(arr, item), condition);
            }
        }
    }
}

function commonAggr(jsonArr, key, text) {
    return jsonArr.filter(function (item) {
        return item[key] == text;
    }).length;
}

function getHeaderData() {
    return _.pluck(config, "label");
}

function renderHeaderHTML(arr) {
    let html = ``;
    html += `<thead class = "headerRow"><tr>`;
    for (let item of arr) {
        html += `<th scope = "col">${item}<i class="fas fa-sort-up asc" data-sort = "sort" data-value = "${item}"></i></th>`;
    }
    html += `</tr></thead>`;
    return html;
}

function resetArr(arr) {
    arr = [];
}

function countObjProps(obj) {
    let count = 0;
    for (let key in obj) {
        count += 1;
    }
    return count;
}

function loadHTML(html, elem, position) {
    const $elem = document.querySelector(elem);
    $elem.insertAdjacentHTML(position, html);
}

function renderDataHTML(
    arr,
    mainSplitterId,
    mainSplitter,
    startSplitter,
    endSplitter,
    lengthELems
) {
    if (countObjProps(arr[0][0]) >= 4) {
        let html = `<tbody><tr><td rowspan = "${lengthELems + 1}">${
            arr[0][0][mainSplitterId]
        }</td></tr>`;
        let firstData = ``;
        let firstColumn = ``;
        let resultHTML = ``;
        let htmlResult = ``;
        for (let arrElem of sortByStr(arr, "date", "asc")) {
            for (let i = 0; i < arrElem.length; i++) {
                if (i == 0) {
                    firstData += `<tr>`;
                    for (let key in arrElem[i]) {
                        if (key == startSplitter) {
                            firstData += `<td rowspan="${arrElem.length}">${arrElem[i][startSplitter]}</td>`;
                        }
                        if (key !== startSplitter && key !== mainSplitter) {
                            firstData += `<td>${arrElem[i][key]}</td>`;
                        }
                    }
                    firstData += `</tr>`;
                }
                if (i !== 0) {
                    firstColumn += `<tr>`;
                    for (let key in arrElem[i]) {
                        if (key !== startSplitter && key !== mainSplitter) {
                            firstColumn += `<td>${arrElem[i][key]}</td>`;
                        }
                    }
                    firstColumn += `</tr>`;
                }
                if (arrElem.length - 1 == i) {
                    html += firstData;
                    html += firstColumn;
                    firstData = ``;
                    firstColumn = ``;
                }
            }
        }
        html += `
     </tbody>`;
        return html;
    } else {
        let html = ``;
        let firstData = ``;
        for (let arrElem of arr) {
            for (let i = 0; i < arrElem.length; i++) {
                if (i == 0) {
                    firstData += `<tr>`;
                    for (let key in arrElem[i]) {
                        if (key == mainSplitter) {
                            firstData += `<td rowspan = "${arrElem.length}">${arrElem[i][key]}</td>`;
                        } else {
                            firstData += `<td>${arrElem[i][key]}</td>`;
                        }
                    }
                    firstData += `</tr>`;
                } else {
                    firstData += `<tr>`;
                    for (let key in arrElem[i]) {
                        if (key !== mainSplitter) {
                            firstData += `<td>${arrElem[i][key]}</td>`;
                        }
                    }
                    firstData += `</tr>`;
                }
            }
        }
        return firstData;
    }
}

function renderOptions() {
    let html = `<select class = "text">
      <option value = "sum" data-id = "num">Суммировать</option>
      <option value = "min" data-id = "num">Найти минимальное число</option>
      <option value = "max" data-id = "num">Найти максимальное число</option>
      <option value = "count" data-id = "numAndStr">Найти количество</option>
  </select><select class = "textBy">`;
    for (let item of config) {
        html += `<option value = "${item.key}">${item.label}</option>`;
    }
    html += `</select`;
    html += `<input type = "text"> Общее: `;
    return html;
}

function renderHTML(arr) {
    let html = `<tbody>`;
    for (let item of arr) {
        html += `<tr>`;
        for (let key in item) {
            html += `<td>${item[key]}</td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody>`;
    return html;
}

function sortByStr(jsonArr, bySort = "value", howSort = "asc") {
    if (howSort == "asc") {
        return sort(jsonArr).asc(i => i[bySort])
    }
    return sort(jsonArr).desc(i => i[bySort])
}