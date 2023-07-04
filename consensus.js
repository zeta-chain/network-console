import {tmURL,nodeURL,addDetails} from './common.js';

async function buildValidatorAddressArray(validators, tmValMap) {
    function bytesToHex(bytes) {
        return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
   
    const result  = []; 
    for (let i=0; i<validators.length; i++) {
        let val = validators[i];
        const v = {}; 
        const consPubKey = atob(val?.consensus_pubkey?.key);
        let bytes = new Uint8Array(consPubKey.length);
        for (let j=0; j<consPubKey.length; j++) {
            bytes[j] = consPubKey.charCodeAt(j);
        }
        // const bytesHash = await window.crypto.subtle.digest('SHA-256', bytes);
        // const addr = bytesHash.slice(0,20);
        // const addrArray = new Uint8Array(addr);
        // const addrHex =  bytesToHex(addrArray).toUpperCase();
        v.pub_key = val.consensus_pubkey.key;
        v.operator_address = val.operator_address;
        v.moniker = val.description.moniker;
        v.consenus_addr_hex = tmValMap[v.pub_key];
        
        // v.consensus_addr_bech32 = encode("zetavalcons", convertbits(addrArray, 8, 5, true), encodings.BECH32);
        result.push(v);
    }
    return result; 
}

async function consensusState() {
    const div = document.getElementById('consensus-state');
    const p1 = await fetch(`${tmURL}/consensus_state`, {method: 'GET'});
    if (!p1.ok) {
	console.log("consensus_state fetch error");
	return;
    }
    const data = await p1.json();
    console.log(data);
    const proposerIndex = data?.result?.round_state?.proposer?.index; 

    const p2 = await fetch(`${tmURL}/dump_consensus_state`, {method: 'GET'});
    if (!p2.ok) {
	console.log("dump_consensus_state fetch error");
	return;
    }
    const data2 = await p2.json();
    console.log(data2);

    const p3 = await fetch(`${nodeURL}/cosmos/staking/v1beta1/validators`, {method: 'GET'});
    if (!p3.ok) {
	console.log("staking validators fetch error");
	return;
    }
    const data3 = await p3.json();
    console.log(data3);

    let resource = `${tmURL}/validators?per_page=200`;
    let p4 = await fetch(resource, { method: 'GET', });
    let data4 = await p4.json();
    const tmVals = data4?.result?.validators;
    const tmValMap = {}; 
    for (let i=0; i<tmVals.length; i++) {
        tmValMap[tmVals[i].pub_key.value] = tmVals[i].address;
    }
    // console.log(tmValMap);
    console.log("tmVals", tmVals);
    let totalVP = 0;
    for (let i=0; i<tmVals.length; i++) {
	totalVP += parseInt(tmVals[i].voting_power);
    }
    console.log("total voting power", totalVP);

    const vals = await buildValidatorAddressArray(data3?.validators, tmValMap);
    console.log(vals);
    
    const roundState = data?.result?.round_state;
    div.appendChild(addDetails(`${roundState["height/round/step"]}`, JSON.stringify(roundState, null, 2)));

    const regex = /{(.*):(.*)}/;
    for (let i=0; i<roundState?.height_vote_set.length; i++) {
	const voteSet = roundState?.height_vote_set[i];
	// console.log(voteSet);
	const prevotesBitArray = voteSet?.prevotes_bit_array;
	// div.appendChild(addDetails(`prevotes_bit_array`, prevotesBitArray));
	const prevotes = prevotesBitArray.match(regex)[2];
	const [prevoteMonikers,pvVP] = bitsToMonikers(prevotes, tmVals, data3?.validators);

	const precommitBitArray = voteSet?.precommits_bit_array;
	const precommits = precommitBitArray.match(regex)[2];
	const [precommitMonikers,pcVP] = bitsToMonikers(precommits, tmVals, data3?.validators);
	div.appendChild(addDetails(`round ${voteSet.round} prevotes nil-voter monikers`, `${prevoteMonikers.toString()}`));
	div.appendChild(addDetails(`prevotes nil-voter voting power ${pvVP}; ${pvVP/totalVP*100}%`, ""));
	div.appendChild(addDetails(`round ${voteSet.round} precommits nil-voter monikers`, precommitMonikers.toString()));
	div.appendChild(addDetails(`precommits nil-voter voting power ${pcVP}; ${pcVP/totalVP*100}%`, ""));
    }
}

consensusState();


// input: xxx_xx_; returns monikers for the _ bits
function bitsToMonikers(bits, tmVals, validators) {
    const monikers = [];
    let VP = 0; 
    for (let i=0; i<bits.length; i++) {
	if (bits[i] === '_') {
	    const pubkey = tmVals[i].pub_key.value;
	    for (let j=0; j<validators.length; j++) {
		if (validators[j].consensus_pubkey.key === pubkey) {
		    monikers.push(validators[j].description.moniker);
		    break;
		}
	    }
	    VP += parseInt(tmVals[i].voting_power);
	}
    }
    return [monikers, VP];
}
