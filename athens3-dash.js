import {decode, encode, convertbits, encodings} from './bech32.js';



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
	};
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

	let pkBech32 = data2.TSS.tss_pubkey;
	let pkDecoded = decode(pkBech32, "bech32");
	console.log(pkDecoded);
	let pkDecodedBytes = convertbits(pkDecoded.data, 5, 8, false);
	console.log("pkDecoded", pkDecodedBytes);
	let pkDecodedHex = int8ArrayToHexRelaxed(pkDecodedBytes);
	console.log("pkDecoded hex",pkDecodedHex);
	
	let summary = {status: kg.status, num_pubkeys: kg.granteePubkeys.length, block_num: kg.blockNumber,
		       tss_pubkey: data2.TSS.tss_pubkey,
		       tss_pubkey_hex: pkDecodedHex,
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
async function validators(){
    const resource = `${nodeURL}/cosmos/staking/v1beta1/validators`;
    const p1 = await fetch(resource, { method: 'GET', });
    let data = await p1.json();
    const div = document.getElementById('validators');
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
    const pre = document.createElement('pre');
    pre.appendChild(makeTableElement(summary));
    div.appendChild(pre);
    div.appendChild(addDetails("Validators Raw JSON", JSON.stringify(data.validators, null, 2)));
}

validators();

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
	let div3 = document.getElementById('txs-result');
	div3.appendChild(txResponsesToTable(data4.tx_responses, data4.txs));
    } catch(error) {
	console.log("fetch error" + error);
    }
}
document.getElementById('button-block-results').addEventListener('click', block_results);

node_info();


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


// proposals

async function proposals() {
    try {
	const resource = `${nodeURL}/cosmos/gov/v1beta1/proposals`;
	var p1 = await fetch(resource, {method: 'GET'});
	if (!p1.ok) {
	    throw new Error(`HTTP error! status: ${p1.status}`);
	}
	const data = await p1.json();
	console.log(data);
	const div0 = document.getElementById('proposals-results');
	div0.appendChild(addDetails(`All proposals (${data?.proposals.length})` ,
				    JSON.stringify(data, null, 2)));

	const proposals = data?.proposals;

	const div = document.getElementById('proposals-summary');


	const div2 = document.getElementById('latest-proposals');
	div2.appendChild(addDetails("Latest Proposal", JSON.stringify(proposals[proposals.length-1], null, 2)));


	const upgradeProposals = proposals?.filter(p => p.content["@type"] == "/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal");
	const div3 = document.getElementById('upgrade-proposals');
	div3.appendChild(addDetails(`Upgrade proposals (${upgradeProposals.length})`, JSON.stringify(upgradeProposals, null, 2)));
	doUpgradeProposals(upgradeProposals);
	

	const passedProposals = proposals?.filter(p => p.status == "PROPOSAL_STATUS_PASSED");
	const div4 = document.getElementById('passed-proposals');
	div4.appendChild(addDetails(`Passed proposals (${passedProposals.length})`, JSON.stringify(passedProposals, null, 2)));

	const activeProposals = proposals?.filter(p => p.status == "PROPOSAL_STATUS_VOTING_PERIOD");
	const div5 = document.getElementById('active-proposals');
	div5.appendChild(addDetails(`Active proposals (${activeProposals.length})`, JSON.stringify(activeProposals, null, 2)));

	const failedProposals = proposals?.filter(p => p.status == "PROPOSAL_STATUS_FAILED");
	const div6 = document.getElementById('failed-proposals');
	div6.appendChild(addDetails(`Failed proposals (${failedProposals.length})`, JSON.stringify(failedProposals, null, 2)));

	const rejectedProposals = proposals?.filter(p => p.status == "PROPOSAL_STATUS_REJECTED");
	const div7 = document.getElementById('rejected-proposals');
	div7.appendChild(addDetails(`Rejected proposals (${rejectedProposals.length})`, JSON.stringify(rejectedProposals, null, 2)));
    } catch (error) {
	console.log("Error " + error);
    }
}
await proposals();

async function doUpgradeProposals(proposals) {
    proposals.reverse(); 
    const div = document.getElementById('upgrade-proposals-summary');
    function analyzeProposal(proposal) {
      const div = document.createElement("div");
      let summary = `ID ${proposal?.proposal_id} - Plan name ${proposal?.content?.plan?.name} - Height ${proposal?.content?.plan?.height} - Status ${proposal?.status}`;
      if (proposal?.status == "PROPOSAL_STATUS_VOTING_PERIOD") {
	// console.log("voting end time", proposal?.voting_end_time);
	const d = new Date(proposal?.voting_end_time);
	const diff = d - new Date();
	summary += ` - Voting ends ${((diff)/1000/3600).toFixed(2)}h from now`;
      }
      div.appendChild(addDetails(summary, JSON.stringify(proposal, null, 2)));
      const info = proposal?.content?.plan?.info;
      if (info) {
	const infoObj = JSON.parse(info);
	console.log(infoObj);
	const div2 = document.createElement("pre");
	div.appendChild(addDetails("Binaries", JSON.stringify(infoObj, null, 2)));
      }
      return div; 
    }
    for (let i=0; i<proposals.length; i++) {
	let proposal = proposals[i];
	div.appendChild(analyzeProposal(proposal));
    }
}

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
	let output = int8ArrayToHex(convertbits(d.data, 5, 8, false));
	summary = {hex_addr: output, zeta_addr: addr};
    } else {
	summary = {error: "invalid input"};
    }
	

    let pre = document.getElementById('address-translation-output');
    pre.replaceChildren(makeTableElement(summary));
}

document.getElementById('button-translate-address').addEventListener('click', translateAddress);


// summary & details are text; div is container
// returns a div
function addDetails(summary, details) {
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
