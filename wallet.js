import './bitcoinjs-lib.js';
import './ecpair.js';
import './secp256k1.js';
import './buffer.js';

const ecc = secp256k1;
const ECPair = ecpair.ECPairFactory(ecc);
const TESTNET = bitcoin.networks.testnet;
const Buffer = buffer.Buffer;


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
