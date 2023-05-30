function base64ToUtf8(base64String) {
    if (base64String == null) {
	return "null";
    }
    const binaryString = atob(base64String);

    return binaryString;
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
