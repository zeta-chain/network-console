export var nodeURL = 'http://46.4.15.110:1317';
export var evmURL = 'http://46.4.15.110:8545';
export var corsProxyURL = 'http://46.4.15.110:8088';
export var checkURL = 'http://46.4.15.110:8888'; // remote server that tests port 6668 p2p nodes
export var tmURL = 'http://46.4.15.110:26657';
export var hashServerURL = 'http://46.4.15.110:9001';
export var RPCByChainID = {
    5: "https://rpc.ankr.com/eth_goerli",
    97: "https://data-seed-prebsc-1-s1.binance.org:8545",
    80001: "https://rpc.ankr.com/polygon_mumbai",
    18332: "https://blockstream.info/testnet/api",
    7001: evmURL,
};
export var esploraAPIURL = "https://blockstream.info/testnet/api";

export async function getForegienCoins() {
    const p1 = await fetch(`${nodeURL}/zeta-chain/zetacore/fungible/foreign_coins`, {  method: 'GET', });
    const data = await p1.json();
    return data?.foreignCoins; 
}

export var Chains = {
    5: {
	"chainId": "5",
	"chainName": "Goerli Testnet",
	"nativeCurrency": {
	    "name": "Goerli Ether",
	    "symbol": "gETH",
	    "decimals": 18
	},
    },
    97: {
	"chainId": "97",
	"chainName": "Binance Smart Chain Testnet",
	"nativeCurrency": {
	    "name": "Testnet BNB",
	    "symbol": "tBNB",
	    "decimals": 18
	},
    },
    80001: {
	"chainId": "80001",
	"chainName": "Polygon Mumbai Testnet",
	"nativeCurrency": {
	    "name": "Matic",
	    "symbol": "tMATIC",
	    "decimals": 18
	},
    },
    7001: {
	"chainId": "7001",
	"chainName": "ZetaChain",
	"nativeCurrency": {
	    "name": "Zeta",
	    "symbol": "ZETA",
	    "decimals": 18
	},
    },
    18332: {
	"chainId": "18332",
	"chainName": "Bitcoin Testnet",
	"nativeCurrency": {
	    "name": "Bitcoin",
	    "symbol": "tBTC",
	    "decimals": 8
	},
    }
};

if (window.location.protocol === 'https:') {
    alert('HTTPS does not work; force your browser to use HTTP instead.');
}



// summary & details are text; div is container
// returns a div
export function addDetails(summary, details) {
    const div = document.createElement('div');
    const detailsElement = document.createElement('details');
    const summaryElement = document.createElement('summary');
    const preElement = document.createElement('pre');
    preElement.textContent = details;
    summaryElement.textContent = summary;
    detailsElement.appendChild(summaryElement);
    detailsElement.appendChild(preElement);
    div.appendChild(detailsElement);
    return div; 
}

export function msToTime(duration) {
    let seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24),
        days = parseInt((duration / (1000 * 60 * 60 * 24)));

    let result = "";

    if(days) { result += days + "d"; }
    if(hours) { result += hours + "h"; }
    if(minutes) { result += minutes + "m"; }
    if(seconds) { result += seconds + "s"; }

    return result.trim();
}

// const Web3 = require('web3');

export function base64ToUtf8(base64String) {
    if (base64String == null) {
	return "null";
    }
    const binaryString = atob(base64String);

    return binaryString;
}

export function parseHexString(hexString) {
  var bytes = [];
  for (var i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return bytes;
}


// Function to add commas to a number string so "1234567" will
// turn into "1,234,567"
export function addCommas(numberString) {
    var parts = numberString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// simple utility to turn a JSON object into a HTML table element;
// two columns: "JSON key", "JSON value";
// each row is a field in JSON object. 
export function makeTableElement(json) {
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
export function makeTableElement2(jsonArray, fields) {
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



export function utcToLocal(utcString) {
    let utcDate = new Date(utcString);
    return utcDate.toLocaleString();
}


// tx_resp is JSON array of tx_responses
// tx is JSON array of tx
export function txResponsesToTable(tx_resp) {
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
export function int8ArrayToHex(array) {
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
export function int8ArrayToHexRelaxed(array) {

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
export function fromDecimals(amount, decimals) {
    return Number(BigInt(amount)) / Math.pow(10, decimals);
}

