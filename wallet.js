import './bitcoinjs-lib.js';
import './ecpair.js';
import './secp256k1.js';
import './buffer.js';

const ecc = secp256k1;
const ECPair = ecpair.ECPairFactory(ecc);
const TESTNET = bitcoin.networks.testnet;
const Buffer = buffer.Buffer;

const esploraAPIURL = "https://blockstream.info/testnet/api";

( () => {
    const inputKey = document.getElementById("input-private-key");
    localStorage.getItem("privateKey") && (inputKey.value = localStorage.getItem("privateKey"));
})();


window.ECPair = ECPair;

let key;
let p2wpkhAddress; 

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
});

async function updateUTXO() {
    const balance = document.getElementById("balance-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/utxo`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`UTXOs (${data.length})`, JSON.stringify(data, null, 2)));
}

async function updateAddressInfo() {
    const balance = document.getElementById("address-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`Address Info: ${data.address} - balance ${data.chain_stats.funded_txo_sum} sats`,
				       JSON.stringify(data, null, 2)));
}

async function updateTxs() {
	const balance = document.getElementById("txs-info");
	const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/txs`);
	const data = await p1.json();
	balance.replaceChildren(addDetails(`Transactions (${data.length})`, JSON.stringify(data, null, 2)));
}

console.log(bitcoin.payments);
(() => {
    
})();


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
