// const Web3 = require('web3');

function createTreeView(element, obj) {
    for (let key in obj) {
        // Create a container for each key-value pair
        let pairContainer = document.createElement('div');
        pairContainer.style.marginLeft = '20px';

        // Create and append the key element
        let keyElement = document.createElement('span');
        keyElement.textContent = key + ': ';
        pairContainer.appendChild(keyElement);

        // Check if the value is an object, if so, recursively create its tree view
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            let subTree = createTreeView(document.createElement('div'), obj[key]);
            pairContainer.appendChild(subTree);
        } else {
            // If the value is not an object, just append the value
            let valueElement = document.createElement('span');
            valueElement.textContent = obj[key];
            pairContainer.appendChild(valueElement);
        }

        // Append the key-value pair container to the element
        element.appendChild(pairContainer);
    }

    return element;
}

function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
}

function base64ToUtf8(base64String) {
    if (base64String == null) {
	return "null";
    }
    const binaryString = atob(base64String);

    return binaryString;
}

function parseHexString(hexString) {
  var bytes = [];
  for (var i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return bytes;
}


function toggleDropdown(dropdownId) {
    var dropdown = document.getElementById(dropdownId);
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
  }


// Function to add commas to a number string so "1234567" will
// turn into "1,234,567"
function addCommas(numberString) {
    var parts = numberString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// simple utility to turn a JSON object into a HTML table element;
// two columns: "JSON key", "JSON value";
// each row is a field in JSON object. 
function makeTableElement(json) {
    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
    table.appendChild(thead);

    // create table body
    var tbody = document.createElement('tbody');

    // iterate over the JSON object
    for (var field in json) {
	// create a row for each field
	var tr = document.createElement('tr');
	
	// create a cell for the field name
	var td1 = document.createElement('td');
	td1.textContent = field;
	tr.appendChild(td1);
	
	// create a cell for the field value
	var td2 = document.createElement('td');
	td2.textContent = json[field];
	tr.appendChild(td2);
	
	// add the row to the table body
	tbody.appendChild(tr);
    }

    // append the body to the table
    table.appendChild(tbody);

    // append the table to the body of the page
    return table; 

}

// given a JSON array, turn it into a table; each row is
// one element in JSON array; each column is a field;
// the list of interested fields are specified by the fields
// string array
function makeTableElement2(jsonArray, fields) {
    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    fields.forEach(header => {
	var th = document.createElement('th');
	th.textContent = header;
	headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // create table body
    var tbody = document.createElement('tbody');

    // iterate over the JSON object
    jsonArray.forEach( row => {
	// console.log("row", row);
	// create a row for each field
	var tr = document.createElement('tr');

	fields.forEach( field => {
	    var td = document.createElement('td');
	    td.textContent = row[field];
	    tr.appendChild(td);
	});
	table.appendChild(tr);
    });

    // append the body to the table
    table.appendChild(tbody);

    // append the table to the body of the page
    return table; 

}



function utcToLocal(utcString) {
    let utcDate = new Date(utcString);
    return utcDate.toLocaleString();
}


// tx_resp is JSON array of tx_responses
// tx is JSON array of tx
function txResponsesToTable(tx_resp) {
    if (tx_resp.length == 0) {
	console.log("error: tx.length == 0",  tx.length);
	return;
    }

    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    let fields = ["tx_hash", "code", "log"];
    fields.forEach(header => {
	var th = document.createElement('th');
	th.textContent = header;
	headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // create table body
    var tbody = document.createElement('tbody');

    for (var i = 0; i < tx_resp.length; i++) {
	var tr = document.createElement('tr');
	var row = {};
	let tx = tx_resp[i].tx;
	let msg_type = tx["body"].messages[0]["msgs"][0]["@type"];
	let txhash = tx_resp[i].txhash;
	row["tx_hash"] = `${txhash}<br>${msg_type}`
	row["code"] = tx_resp[i].code;
	var raw_log = tx_resp[i].raw_log;
	// console.log(JSON.parse(raw_log));
	var log_elm; 
	try {
	    var log = JSON.parse(raw_log);
	    log_elm = document.createElement('pre');
	    log_elm.textContent = JSON.stringify(log, null, 2);
	} catch (e) {
	    log_elm = document.createElement('div');
	    log_elm.textContent = raw_log;
	}

	let div = document.createElement('div');
	div.classList = "tooltip";
	div.appendChild(document.createTextNode("hover"));
	// span.classList = "tooltiptext";
	log_elm.classList = "tooltiptext";
	div.appendChild(log_elm);

	
	row["log"] = div.outerHTML;
	// row["log"] = tx_resp[i].raw_log;
	fields.forEach( field => {
	    var td = document.createElement('td');
	    td.innerHTML = row[field];
	    tr.appendChild(td);
	});
	tbody.appendChild(tr);
    }

    // iterate over the JSON object
    // jsonArray.forEach( row => {
    // 	// console.log("row", row);
    // 	// create a row for each field
    // 	var tr = document.createElement('tr');

    // 	fields.forEach( field => {
    // 	    var td = document.createElement('td');
    // 	    td.textContent = row[field];
    // 	    tr.appendChild(td);
    // 	});
    // 	table.appendChild(tr);
    // });

    // append the body to the table
    table.appendChild(tbody);

    // append the table to the body of the page
    return table;     

}



// array of int8 (length 20) to hex string (eth address format)
function int8ArrayToHex(array) {
    if (array.length != 20) {
	console.log("error: array.length != 20", array.length);
	return;
    }
    let hexString = array.map(num => {
	let hex = num.toString(16);
	if (hex.length < 2) {
            hex = '0' + hex;
	}
	return hex;
    }).join('');

    hexString = '0x' + hexString;
    return Web3.utils.toChecksumAddress(hexString);
}

// array of int8 (length any) to hex string 
function int8ArrayToHexRelaxed(array) {

    let hexString = array.map(num => {
	let hex = num.toString(16);
	if (hex.length < 2) {
            hex = '0' + hex;
	}
	return hex;
    }).join('');

    hexString = '0x' + hexString;
    return hexString;
}

// amount in smallest denomination (wei, satoshi, etc), convert into (eth, btc, etc)
// amount is string; decimals is Number; return Number
function fromDecimals(amount, decimals) {
    return Number(BigInt(amount)) / Math.pow(10, decimals);
}
