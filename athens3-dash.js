import {decode, encode, convertbits, encodings} from './bech32.js';


var nodeURL = 'http://46.4.15.110:1317';
var corsProxyURL = 'http://3.132.197.22:8088';

var tmURL = 'http://46.4.15.110:26657';

// Node info
async function node_info(){
    try {
	var resource = "cosmos/base/tendermint/v1beta1/node_info";
	var elemId = "node-info";
	var syncing = true; 
	var r1 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	resource = "cosmos/base/tendermint/v1beta1/syncing";
	var r2 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});	  
	var data = await r1.json();
	// console.log(data);
	var data2 = await r2.json();
	
	
	const div1 = document.getElementById(elemId);
	div1.textContent = JSON.stringify(data, null, 2);
	let summary = {
	    // cors_proxy_url: corsProxyURL,
	    node_url: nodeURL,
	    syncing: data2.syncing,
	    network: data.default_node_info.network,
	    moniker: data.default_node_info.moniker,
	    zetacored_version: data.application_version.version,
	}
	let div2 = document.getElementById(`${elemId}-summary`);
	// div2.textContent = JSON.stringify(makeTableElement(summary), null, 2);
	div2.appendChild(makeTableElement(summary));
    } catch (error) {
	console.log('error', error);
	throw error;
    }
}


// Keygen widget
async function keygen() {
    try {
	var resource = "zeta-chain/crosschain/keygen";
	var p1 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	let data = await p1.json();
	const div1 = document.getElementById('current-keygen');
	div1.textContent = JSON.stringify(data, null, 2);
	let kg = data.Keygen;

	resource = "zeta-chain/crosschain/TSS";
	var p2 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	let data2 = await p2.json();
	const div2 = document.getElementById('current-tss');
	div2.textContent = JSON.stringify(data2, null, 2);

	resource = "zeta-chain/zetacore/crosschain/get_tss_address";
	var p3 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	let data3 = await p3.json();

	let summary = {status: kg.status, num_pubkeys: kg.granteePubkeys.length, block_num: kg.blockNumber, tss_pubkey: data2.TSS.tss_pubkey,
		       tss_address_eth: data3.eth, tss_address_btc: data3.btc}; 
	let div3 = document.getElementById("keygen-summary");

	div3.replaceChildren(makeTableElement(summary));
    } catch (error) {
	console.log('error', error);
	// throw error;
    }
}

keygen(); 

// Network status widget
fetch(`${tmURL}/status`, {
    method: 'GET',
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}).then(data => {
    let div = document.getElementById('block');
    div.innerHTML = JSON.stringify(data.result, null, 2);
    let div2 = document.getElementById('block-summary');
    let summary = {"block height": data.result.sync_info.latest_block_height,
		   "block timestamp": utcToLocal(data.result.sync_info.latest_block_time),
		   "earliest block timestamp": utcToLocal(data.result.sync_info.earliest_block_time)};
    div2.appendChild(makeTableElement(summary));
}).catch(error => {
    console.log("fetch error" + error);
})

// supply widget
fetch(`${nodeURL}/cosmos/bank/v1beta1/supply`, {
    method: 'GET',
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}).then(data => {
    let div = document.getElementById('supply');
    div.textContent = JSON.stringify(data, null, 2);

    let amount = BigInt(data.supply[0].amount);
    let amountZeta = amount/BigInt(1e18); 
    let div2 = document.getElementById('supply-summary');
    let summary = {"supply": addCommas((amountZeta).toString()), "denom": "ZETA"};
    div2.appendChild(makeTableElement(summary));
}).catch(error => {
    console.log("fetch error" + error);
})

async function upgrade_plan() {
    try {
	var resource = "/cosmos/upgrade/v1beta1/current_plan";
	var p1 = await fetch(`${nodeURL}/${resource}`, { method: 'GET', });
	let data = await p1.json();
	const div1 = document.getElementById('upgrade-plan');
	div1.textContent = JSON.stringify(data, null, 2);
	if (data.plan == null) {
	    return;
	}
	let summary = {plan: data.plan.name, height: data.height, time: utcToLocal(data.time)};
	let div2 = document.getElementById("upgrade-plan-summary");
	div2.appendChild(makeTableElement(summary));
    } catch (error) {
	console.log('error', error);
    }
}
upgrade_plan();

// validators
{
    var divElement = document.createElement("div");
    divElement.classList = "item";
    var widgets = document.getElementById("network-widgets");
    widgets.appendChild(divElement);
    var header = document.createElement("b");
    header.textContent = "Validators";
    divElement.appendChild(header);
    var summaryPre = document.createElement("div");
    divElement.appendChild(summaryPre);
    var button = document.createElement("button");
    button.textContent = "Raw JSON"; 
    button.onclick = function() {toggleDropdown("validators-dropdown")};
    divElement.appendChild(button);
    var detailPre = document.createElement("pre");
    detailPre.id = "validators-dropdown";
    divElement.appendChild(detailPre);
    detailPre.classList = "dropdown-content";
    fetch(`${nodeURL}/cosmos/staking/v1beta1/validators`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        detailPre.textContent = JSON.stringify(data, null, 2); 
        let jailed = 0;
        let jailed_monikers = []; 
        for (let i=0; i<data.validators.length; i++) {
            let val = data.validators[i];
            if (val.jailed) {
                jailed++;
                jailed_monikers.push(val.description.moniker);
            }
        }
        var summary = {"num_validators": data.validators.length, "num_jailed": jailed, "jailed_monikers": jailed_monikers};
        // summaryPre.textContent = JSON.stringify(summary, null, 2);
	summaryPre.appendChild(makeTableElement(summary));
    }).catch(error => {
        console.log("fetch error" + error);
    })
}

// supported chains
{
    fetch(`${nodeURL}/zeta-chain/observer/supportedChains`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('supported-chains');
        div.textContent = JSON.stringify(data, null, 2);
        let div2 = document.getElementById('supported-chains-summary');
	div2.appendChild(makeTableElement2(data.chains, ["chain_name", "chain_id"])); 
	
    }).catch(error => {
        console.log("fetch error" + error);
    })
}


// foreign coins
{
    fetch(`${nodeURL}/zeta-chain/zetacore/fungible/foreign_coins`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('foreign-coins');
        div.textContent = JSON.stringify(data, null, 2);

        let div2 = document.getElementById('foreign-coins-summary');
	div2.appendChild(makeTableElement2(data.foreignCoins, ["zrc20_contract_address", "foreign_chain_id", "symbol", "coin_type"]));
    }).catch(error => {
        console.log("fetch error" + error);
    })
}


// system contract
async function system_contract() {
    fetch(`${nodeURL}/zeta-chain/zetacore/fungible/system_contract`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('system-contract');
        div.textContent = JSON.stringify(data, null, 2);

        let div2 = document.getElementById('system-contract-summary');
	div2.appendChild(makeTableElement(data.SystemContract));
        // let summary = {"supply": addCommas((amountZeta).toString()), "denom": "ZETA"};
        // div2.textContent = JSON.stringify(summary, null, 2);
    }).catch(error => {
        console.log("fetch error" + error);
    })
}

// block results
async function block_results() {
    try {
	var block_height = document.getElementById('input-block-height').value;
	// /block_results API
	var p2 = await fetch(`${tmURL}/block_results?height=${block_height}`, {method: 'GET'});
	var data2 = await p2.json();
	console.log(data2);
	var div = document.getElementById('block-result');
	div.textContent = JSON.stringify(data2, null, 2);
	var txs_length = data2.result.txs_results  ? data2.result.txs_results.length : 0;
	var begin_events = data2.result.begin_block_events ? data2.result.begin_block_events.length : 0;
	var end_events = data2.result.end_block_events ? data2.result.end_block_events.length : 0;
	var summary = {height: block_height, num_txs: txs_length, num_begin_events: begin_events, num_end_events: end_events};
	console.log(summary);
	var div2 = document.getElementById('block-result-summary');
	div2.appendChild(makeTableElement(summary));
	// if (txs_length > 0) {
	//     for (let i=0; i<txs_length; i++) {
	// 	let tx = data2.result.txs_results[i];
	// 	console.log(`#{i}:`, tx);
	//     }
	// }
	
	// /block API:
	// var p3 = await fetch(`${tmURL}/block?height=${block_height}`, {method: 'GET'});
	// var data3 = await p3.json();
	// console.log(data3.result);

	// txs API
	var p4 = await fetch(`${nodeURL}/cosmos/tx/v1beta1/txs?events=tx.height%3D${block_height}`, {method: 'GET'});
	var data4 = await p4.json();
	console.log(data4);
	div3 = document.getElementById('txs-result');
	div3.appendChild(txResponsesToTable(data4.tx_responses, data4.txs));
    } catch(error) {
	console.log("fetch error" + error);
    }
}

node_info();
system_contract();

// block_results();


// ------------------------------------------------------------------------------
// --------------   Aux functions -----------------------------------------------
// ------------------------------------------------------------------------------

async function latest_block() {
    try {
	var p1 = await fetch(`${tmURL}/block`, {method: 'GET'});
	var data = await p1.json();
	var latest_block = data.result.block.header.height;
	var p2 = await fetch(`${tmURL}/block_results?height=${latest_block}`, {method: 'GET'});
	var data2 = await p2.json();
	console.log(data2);
	var begin_block_events = data2.result.begin_block_events;
	begin_block_events.forEach(function(event) {

	    console.log(event.type);
	    for (let i=0; i<event.attributes.length; i++) {
		let key = base64ToUtf8(event.attributes[i].key);
		let value = base64ToUtf8(event.attributes[i].value);
		console.log(key + " " + value);
	    }
	    
	});

    } catch (error) {
	console.log("Error " + error);
    }
}

async function last_txs(ntx, msg_type) {
    const max_lookback_blocks = 2;
    try {
	var p1 = await fetch(`${tmURL}/block`, {method: 'GET'});
	var data = await p1.json();
	console.log(data);
	var latest_block = data.result.block.header.height;
	console.log("latest_block "+latest_block);
	for (let bn = latest_block; bn > latest_block-max_lookback_blocks && bn >=1 ; bn--) {
	    let ep = `${nodeURL}/cosmos/tx/v1beta1/txs?events=tx.height%3D${bn}`;
	    // console.log(ep);
	    var p1 = await fetch(ep, {method: 'GET'});
	    var data1 = await p1.json();
	    
	    // var data2 = await p2.json();
	    // console.log(data2);
	    var txs = data1.tx_responses;
	    console.log(`block ${bn}`, txs);
	}
    } catch (error) {
	console.log("Error " + error);
    }
}

// async function block_query() {
//     var resource = "
// }


last_txs(5);
// latest_block();



/// -----------------  Non API utilities ---------------------

function translateAddress() {
    let addr = document.getElementById('address-translation-input').value;
    // test case
//   "hex_addr": "0x6dA30bFA65E85a16b05bCE3846339ed2BC746316",
//   "zeta_addr": "zeta1dk3sh7n9apdpdvzmecuyvvu76278gcck2jmfcg"
    var summary = {};
    if (addr.length == 42 && addr.slice(0,2) == "0x") { // hex
	let data = parseHexString(addr.slice(2,42));
	let output  = encode("zeta", convertbits(data, 8, 5, true), encodings.BECH32);
	summary = {hex_addr: addr, zeta_addr: output};
    } else if (addr.length == 43 && addr.slice(0,5) == "zeta1") {
	let d = decode(addr, encodings.BECH32);
	console.log(d);
	let output = int8ArrayToHex(convertbits(d.data, 5, 8, false))
	summary = {hex_addr: output, zeta_addr: addr};
    } else {
	summary = {error: "invalid input"};
    }
	

    let pre = document.getElementById('address-translation-output');
    pre.replaceChildren(makeTableElement(summary));
}

document.getElementById('button-translate-address').addEventListener('click', translateAddress);


// ---------------- zetaclients ------------------------------
async function zetaclients_versions() {
    let IPs = ["52.42.64.63", "150.136.176.81", "202.8.10.137"]
    let ipAPI = "http://ip-api.com/json";
    try {
	let div = document.getElementById('zetaclients-summary');
	console.log(div);

	let fetchPromises = [];
	let p2pPromises = [];
	let geoPromises = [];
	for (let i=0; i<IPs.length; i++) {
	    fetchPromises.push(fetch(`${corsProxyURL}/http://${IPs[i]}:8123/version`, {method: 'GET'}));
	    p2pPromises.push(fetch(`${corsProxyURL}/http://${IPs[i]}:8123/p2p`, {method: 'GET'}));
	    geoPromises.push(fetch(`${ipAPI}/${IPs[i]}`, {method: 'GET'}));
	}


	let table = document.createElement('table');

	let thead = document.createElement('thead');
	table.replaceChildren(thead);
	let headRow = document.createElement('tr');
	thead.replaceChildren(headRow);
	let th1 = document.createElement('th');
	th1.innerText = "IP";
	headRow.appendChild(th1);
	let th2 = document.createElement('th');
	th2.innerText = "Version";
	headRow.appendChild(th2);
	let th3 = document.createElement('th');
	th3.innerText = "P2P Peer ID";
	headRow.appendChild(th3);
	let th4 = document.createElement('th');
	th4.innerText = "Geolocation";
	headRow.appendChild(th4);
	let th5 = document.createElement('th');
	th5.innerText = "Org";
	headRow.appendChild(th5);
	
	div.appendChild(table);

	for (let i=0; i<IPs.length; i++) {
	    let tr = document.createElement('tr');
	    table.appendChild(tr);
	    let td1 = document.createElement('td');
	    td1.innerText = IPs[i];
	    let td2 = document.createElement('td');
	    td2.id = `zetaclients-version-${i}`;
	    let td3 = document.createElement('td');
	    td3.id = `zetaclients-peerid-${i}`;
	    let td4 = document.createElement('td');
	    td4.id = `zetaclients-geolocation-${i}`;
	    let td5 = document.createElement('td');
	    td5.id = `zetaclients-org-${i}`;
	    tr.appendChild(td1);
	    tr.appendChild(td2);
	    tr.appendChild(td3);
	    tr.appendChild(td4);
	    tr.appendChild(td5);
	}

	for (let i=0; i<IPs.length; i++) {
	    let p1 = await fetchPromises[i];
	    if (!p1.ok) {
		console.log("Error " + p1.status);
		continue;
	    }
	    let data = await p1.text();
	    let td = document.getElementById(`zetaclients-version-${i}`);
	    td.innerText = data;

	    let p2 = await p2pPromises[i];
	    if (!p2.ok) {
		console.log("Error " + p2.status);
		continue;
	    }
	    let data2 = await p2.text();
	    let td2 = document.getElementById(`zetaclients-peerid-${i}`);
	    td2.innerText = data2;

	    let p3 = await geoPromises[i];
	    if (!p3.ok) {
		console.log("Error " + p3.status);
		continue;
	    }
	    let data3 = await p3.json();
	    let td3 = document.getElementById(`zetaclients-geolocation-${i}`);
	    td3.innerText = `${data3.city}, ${data3.country}`;
	    let td4 = document.getElementById(`zetaclients-org-${i}`);
	    td4.innerText = data3.org;
	    
	}
    } catch (error) {
	console.log("Error " + error);
    }
}

zetaclients_versions();
