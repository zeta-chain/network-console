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
    console.log(tmVals);

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
	const prevoteMonikers = bitsToMonikers(prevotes, vals);
	// console.log(prevoteMonikers);
	div.appendChild(addDetails(`round ${voteSet.round} prevotes nil-voter monikers`, `${prevoteMonikers.toString()}`));
	const precommitBitArray = voteSet?.precommits_bit_array;
	// div.appendChild(addDetails(`round ${voteSet.round} precommits_bit_array`, precommitBitArray));
	const precommits = precommitBitArray.match(regex)[2];
	const precommitMonikers = bitsToMonikers(precommits, vals);
	// console.log(precommitMonikers);
	div.appendChild(addDetails(`round ${voteSet.round} precommits nil-voter monikers`, precommitMonikers.toString()));
    }
}

consensusState();


// input: xxx_xx_; returns monikers for the _ bits
function bitsToMonikers(bits, vals) {
    const monikers = [];
    for (let i=0; i<bits.length; i++) {
	if (bits[i] === '_') {
	    monikers.push(vals[i].moniker);
	}
    }
    return monikers;
}
