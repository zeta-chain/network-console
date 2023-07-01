import './bitcoinjs-lib.js';
import './ecpair.js';
import './secp256k1.js';
import './buffer.js';
import './bip66.js';

const ecc = secp256k1;
const ECPair = ecpair.ECPairFactory(ecc);
const TESTNET = bitcoin.networks.testnet;
const Buffer = buffer.Buffer;
const hash160 = (b) => bitcoin.crypto.ripemd160(bitcoin.crypto.sha256(b));

const esploraAPIURL = "https://blockstream.info/testnet/api";

const validator = (
    pubkey,
    msghash,
    signature,
) => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

// test
// const sig = "304402202550e7d33b5a09c2dbec49141ff378630a299f1c1f309f7893475e1302b6261702206f32355dd2ac25495135d69f81bc55f3dc792a04c78427af95a4b4cb700e024b01";
// const sigBuffer = Buffer.from(sig, 'hex');
// const decoded = bip66.decode(sigBuffer.slice(0, -1));
// console.log(decoded); 
// end test

( () => {
    const inputKey = document.getElementById("input-private-key");
    localStorage.getItem("privateKey") && (inputKey.value = localStorage.getItem("privateKey"));
})();


window.ECPair = ECPair;

let key;
let p2wpkhAddress;
let txs;
let utxos;

document.getElementById('button-broadcast').addEventListener('click', async () => {
    const txHex = document.getElementById("transaction-hex").textContent;
    console.log("txHex", txHex);
    const endpoint = `https://api.blockcypher.com/v1/btc/test3/txs/push`;

    const p1 = await fetch(endpoint, {method: "POST", body: JSON.stringify({tx: txHex})});
    const data = await p1.json();
    console.log("data", data);
    const div = document.getElementById("broadcast-result");
    div.replaceChildren(addDetails(`Broadcasted Transaction: txid ${data?.tx?.hash}`, JSON.stringify(data, null, 2)));

    const div2 = document.getElementById("explorer-link");
    const txlink = document.createElement("a");
    txlink.href = `https://blockstream.info/testnet/tx/${data?.tx?.hash}`;
    txlink.textContent = "View broadcasted tx on Blockstream explorer";
    txlink.target = "_blank";
    div2.replaceChildren(txlink);
});


document.getElementById('button-decode').addEventListener('click', async () => {
    const txHex = document.getElementById("transaction-hex").textContent;
    console.log("txHex", txHex);
    const endpoint = `https://api.blockcypher.com/v1/btc/test3/txs/decode`;

    const p1 = await fetch(endpoint, {method: "POST", body: JSON.stringify({tx: txHex})});
    const data = await p1.json();
    console.log("data", data);
    const div = document.getElementById("decoded-tx");
    div.replaceChildren(addDetails("Decoded Transaction", JSON.stringify(data, null, 2)));
});

document.getElementById('button-send').addEventListener('click', async () => {
    const to = document.getElementById("input-recipient").value;
    const amount = parseInt(document.getElementById("input-amount").value);
    const memo = document.getElementById("input-memo-hex").value;
    console.log("to", to);
    console.log("amount", amount);
    console.log("memo", memo);
    const memoBytes = Buffer.from(memo, 'hex');
    const tx = await makeTransaction(to, amount, utxos, memoBytes);
    console.log("tx", tx);
    const pre = document.getElementById("transaction-hex");
    pre.innerHTML = tx;
});

document.getElementById('button-generate-key').addEventListener('click', () => {
    const keyPair = ECPair.makeRandom({ network: TESTNET });
    console.log("keyPair", keyPair.privateKey);
    let pre = document.getElementById("output-private-key");
    pre.innerHTML = "Private key (please save it): " + keyPair.privateKey.toString('hex');
});

document.getElementById('button-set-key').addEventListener('click', async () => {
    const keyInput = document.getElementById("input-private-key");
    const keyHex = keyInput.value;
    localStorage.setItem("privateKey", keyHex);
    key = ECPair.fromPrivateKey(Buffer.from(keyHex, 'hex'), { network: TESTNET });
    const addressPre = document.getElementById("key-info");
    const {address} = bitcoin.payments.p2wpkh({ pubkey: key.publicKey, network: TESTNET });
    p2wpkhAddress = address;
    addressPre.innerHTML = "P2WPKH (SegWit) Address: " + address;

    updateUTXO();
    updateAddressInfo();
    updateTxs();

    console.log("WIF", key.toWIF());
});

async function updateUTXO() {
    const balance = document.getElementById("balance-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/utxo`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`UTXOs (${data.length})`, JSON.stringify(data, null, 2)));
    utxos = data;
    // makeTransaction(p2wpkhAddress, 10000, data, "hello world");
}

async function updateAddressInfo() {
    const balance = document.getElementById("address-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}`);
    const data = await p1.json();
    const bal = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    balance.replaceChildren(addDetails(`Address Info: ${data.address} - balance ${bal} sats`,
				       JSON.stringify(data, null, 2)));
}

async function updateTxs() {
    const balance = document.getElementById("txs-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/txs`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`Transactions (${data.length})`, JSON.stringify(data, null, 2)));
    txs = data;


}

// memo: Buffer of at most 80 BYTES
async function makeTransaction(to, amount, utxos, memo) {
    if (memo.length >= 78) throw new Error("Memo too long");
    utxos.sort((a, b) => a.value - b.value); // sort by value, ascending
    const fee = 10000;
    const total = amount + fee;
    let sum = 0;
    const pickUtxos = [];
    for (let i = 0; i < utxos.length; i++) {
	const utxo = utxos[i];
	sum += utxo.value;
	pickUtxos.push(utxo);
	if (sum >= total) break;
    }
    if (sum < total) throw new Error("Not enough funds");
    const change = sum - total;
    const txs = []; // txs corresponding to the utxos
    for (let i = 0; i < pickUtxos.length; i++) {
	const utxo = pickUtxos[i];
	const p1 = await fetch(`${esploraAPIURL}/tx/${utxo.txid}`);
	const data = await p1.json();
	txs.push(data);
    }
    console.log("pickUtxos", pickUtxos);
    console.log("txs", txs);
    
    // try creating a transaction
    const psbt = new bitcoin.Psbt({network: TESTNET});
    psbt.addOutput({address: to, value: amount});

    if (memo.length > 0) {
	const embed = bitcoin.payments.embed({data: [memo]});
	psbt.addOutput({script: embed.output, value: 0});
    }
    if (change > 0) {
	psbt.addOutput({address: p2wpkhAddress, value: change});
    }


    for (let i = 0; i < pickUtxos.length; i++) {
	const utxo = pickUtxos[i];
	const inputData = {};
	inputData.hash = txs[i].txid;
	inputData.index = utxo.vout;
	const witnessUtxo = {script: Buffer.from(txs[i].vout[utxo.vout].scriptpubkey, 'hex'), value: utxo.value};
	inputData.witnessUtxo = witnessUtxo;
	psbt.addInput(inputData);

    }
    for (let i = 0; i < pickUtxos.length; i++) {
	psbt.signInput(i, key); 
	if (!psbt.validateSignaturesOfInput(i, validator)) {
	    throw new Error("invalid input");
	}
    }

    psbt.finalizeAllInputs(); 
    console.log(psbt);
    console.log(psbt.extractTransaction().toHex());
    // broadcast txid: 3532fceaf248205cb8ebfcbe56d659187ae509b559003c8a3abf863217691e17
    return psbt.extractTransaction().toHex();
}


function createPayment(type, myKeys, network) {
    network = network || TESTNET;
    const splitType = type.split('-').reverse();
    const keys = myKeys || [];

    if (!myKeys) keys.push(ECPair.makeRandom({ network: network }));
    let payment = bitcoin.payments["p2wpkh"]({ pubkey: keys[0].publicKey, network: network });

    return { payment, keys };
}

function getWitnessUtxo(out) {
    delete out.address;
    out.script = Buffer.from(out.script, 'hex');
    return out;
}

async function getInputData(amount, payment, isSegwit, redeemType) {
    
}
