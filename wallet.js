import './bitcoinjs-lib.js';
import './ecpair.js';
import './secp256k1.js';
import './buffer.js';
import './web3.min.js';
import {
    esploraAPIURL,
    getForegienCoins,
    RPCByChainID,
    evmURL,
    addDetails,
    makeTableElement,
    makeTableElement2,
    Chains,
    externalChainIDs,
    network, renderHeader
} from './common.js';
import {encodings, decode, convertbits} from './bech32.js';

await renderHeader();

// console.log("Web3", Web3);
let ZRC20ABI;
let UNISWAPV2FACTORYABI;
let UNISWAPV2ROUTER02ABI;
let UNISWAPV2PAIRABI;

async function read_abis() {
    try {
        let p3 = await fetch('abi/ZRC20.json');
        let data3 = await p3.json();
        ZRC20ABI = data3.abi;
        console.log("set ZRC20ABI", ZRC20ABI);
    } catch (err) {
        console.log(err);
    }
    try {
        let p3 = await fetch('abi/UniswapV2Factory.json');
        let data3 = await p3.json();
        UNISWAPV2FACTORYABI = data3.abi;
        console.log("set UNISWAPV2FACTORYABI", UNISWAPV2FACTORYABI);
    } catch (err) {
        console.log(err);
    }
    try {
        let p3 = await fetch('abi/UniswapV2Router02.json');
        let data3 = await p3.json();
        UNISWAPV2ROUTER02ABI = data3.abi;
        console.log("set UNISWAPV2ROUTER02ABI", UNISWAPV2ROUTER02ABI);
    } catch (err) {
        console.log(err);
    }
    try {
        let p3 = await fetch('abi/UniswapV2Pair.json');
        let data3 = await p3.json();
        UNISWAPV2PAIRABI = data3.abi;
        console.log("set UNISWAPV2PAIRABI", UNISWAPV2PAIRABI);
    } catch (err) {
        console.log(err);
    }
}

await read_abis();

const ecc = secp256k1;
const ECPair = ecpair.ECPairFactory(ecc);

let NETWORK;
let BLOCKCYPHER;
if (network == "mockmain" || network == "mainnet") {
    NETWORK = bitcoin.networks.mainnet;
    BLOCKCYPHER = "https://api.blockcypher.com/v1/btc/main";
} else {
    NETWORK = bitcoin.networks.testnet;
    BLOCKCYPHER = "https://api.blockcypher.com/v1/btc/test3";
}
const Buffer = buffer.Buffer;
const hash160 = (b) => bitcoin.crypto.ripemd160(bitcoin.crypto.sha256(b));


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

(() => {
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
    const endpoint = `${BLOCKCYPHER}/txs/push`;

    const p1 = await fetch(endpoint, {method: "POST", body: JSON.stringify({tx: txHex})});
    const data = await p1.json();
    console.log("data", data);
    const div = document.getElementById("broadcast-result");
    div.replaceChildren(addDetails(`Broadcasted Transaction: txid ${data?.tx?.hash}`, JSON.stringify(data, null, 2)));

    const div2 = document.getElementById("explorer-link");
    const txlink = document.createElement("a");
    txlink.href = `${esploraAPIURL}/tx/${data?.tx?.hash}`;
    txlink.textContent = "View broadcasted tx on Blockstream explorer";
    txlink.target = "_blank";
    div2.replaceChildren(txlink);
});


document.getElementById('button-decode').addEventListener('click', async () => {
    const txHex = document.getElementById("transaction-hex").textContent;
    console.log("txHex", txHex);
    const endpoint = `${BLOCKCYPHER}/txs/decode`;

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
    const keyPair = ECPair.makeRandom({network: NETWORK});
    console.log("keyPair", keyPair.privateKey);
    let pre = document.getElementById("output-private-key");
    pre.innerHTML = "Private key (please save it): " + keyPair.privateKey.toString('hex');
});

document.getElementById('button-set-key').addEventListener('click', async () => {
    const keyInput = document.getElementById("input-private-key");
    const keyHex = keyInput.value;
    localStorage.setItem("privateKey", keyHex);
    key = ECPair.fromPrivateKey(Buffer.from(keyHex, 'hex'), {network: NETWORK});
    const addressPre = document.getElementById("key-info");
    const {address} = bitcoin.payments.p2wpkh({pubkey: key.publicKey, network: NETWORK});
    p2wpkhAddress = address;
    addressPre.innerHTML = "P2WPKH (SegWit) Address: " + address + "  (ASCII in HEX): " + stringToAsciiHex(address);
    // addressPre

    console.log("pubkey", (key.publicKey));

    updateUTXO();
    updateAddressInfo();
    updateTxs();
    updateEthAccount();

    console.log("WIF", key.toWIF());


});

async function updateUTXO() {
    const balance = document.getElementById("balance-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/utxo`);
    const data = await p1.json();
    // balance.replaceChildren(addDetails(`UTXOs (${data.length})`, JSON.stringify(data, null, 2)));
    balance.replaceChildren(
        DETAILS(
            SUMMARY(TEXT(`UTXOs (${data.length})`)),
            PRE(TEXT(JSON.stringify(data, null, 2)))
        ));
    utxos = data;

}

async function updateAddressInfo() {
    const balance = document.getElementById("address-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}`);
    const data = await p1.json();
    const bal = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    balance.replaceChildren(
        DETAILS(
            SUMMARY(TEXT(`Address Info: ${data.address} - balance ${bal} sats`)),
            PRE(TEXT(JSON.stringify(data, null, 2)))
        ));
}

async function updateTxs() {
    const balance = document.getElementById("txs-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${p2wpkhAddress}/txs`);
    const data = await p1.json();
    balance.replaceChildren(
        DETAILS(
            SUMMARY(TEXT(`Transactions (${data.length})`)),
            PRE(TEXT(JSON.stringify(data, null, 2)))
        ));
    txs = data;
}

// memo: Buffer of at most 80 BYTES
async function makeTransaction(to, amount, utxos, memo) {
    if (memo.length >= 78) throw new Error("Memo too long");
    utxos.sort((a, b) => a.value - b.value); // sort by value, ascending
    const fee = 10_000;
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
    const psbt = new bitcoin.Psbt({network: NETWORK});
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

// ethereum wallet

const web3zevm = new Web3(evmURL);
// window.web3zevm = web3zevm;
const web3ByChainId = {};
const ChainIDs = externalChainIDs;
for (const chainId of ChainIDs) {
    if (chainId === 18332 || chainId === 8332) continue;
    web3ByChainId[chainId] = new Web3(RPCByChainID[chainId]);
}


let ethAccount;

async function updateEthAccount() {
    console.log("key", key);
    ethAccount = await web3zevm.eth.accounts.privateKeyToAccount("0x" + key.privateKey.toString('hex'));
    window.ethAccount = ethAccount;
    console.log("ethAccount", ethAccount);
    const div = document.getElementById("eth-address-info");
    // div.appendChild(addDetails(`Ethereum Address ${ethAccount.address}`, JSON.stringify(ethAccount, null, 2)));
    const template = document.createElement('template');
    template.innerHTML = `<span style="font-family:monospace">Ethereum Address ${ethAccount.address}</span>`;
    div.appendChild(template.content.firstChild);

    const foreignCoins = await getForegienCoins();
    console.log("foreignCoins", foreignCoins);
    let balanceSummary = [];
    for (const chainId of ChainIDs) {
        const summary = {chain: Chains[chainId].chainName};
        if (chainId != 18332 && chainId != 8332) {
            console.log("chainId", chainId)
            const balance = await web3ByChainId[chainId].eth.getBalance(ethAccount.address);
            summary.gas_balance = `${Web3.utils.fromWei(balance)} ${Chains[chainId].nativeCurrency.symbol}`;
        }
        const coins = foreignCoins.filter(c => c.foreign_chain_id == chainId);
        // if (coins.length != 1) {
        //     console.log("warning: coins length != 1", coins);
        //     continue;
        // }
        for (let i=0; i<coins.length; i++) {
            const zrc20Address = coins[i]?.zrc20_contract_address;
            console.log(`${chainId} zrc20Address`, zrc20Address);
            const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20Address);
            const zrc20Balance = await zrc20Contract.methods.balanceOf(ethAccount.address).call();
            console.log(`${chainId} zrc20Balance`, zrc20Balance);
            const decimals = coins[i]?.decimals;
            summary.zrc20_balance = `${Number(zrc20Balance) / Math.pow(10, decimals)} ${coins[i].symbol}`;
            console.log(`zrc20 balance ${coins[i].symbol} ${Number(zrc20Balance)}`);
            balanceSummary.push(summary);
        }
    }
    div.appendChild(makeTableElement2(balanceSummary, ["chain", "gas_balance", "zrc20_balance"]));

    document.getElementById("eth-balance-info").innerHTML = `<span style="font-family:monospace">Ethereum Balance ${Web3.utils.fromWei(await web3zevm.eth.getBalance(ethAccount.address))} ETH</span>`;

}

document.getElementById('button-eth-send').addEventListener('click', async () => {
    const web3 = web3zevm;
    // validate address & amount
    const to = document.getElementById("input-eth-recipient").value;
    if (!Web3.utils.isAddress(to)) {
        alert("Invalid recipient address");
        return;
    }
    const amount = document.getElementById("input-eth-amount").value;
    if (isNaN(amount)) {
        alert("Invalid amount");
        return;
    }
    const gasPrice = await web3zevm.eth.getGasPrice();
    console.log("gasPrice", gasPrice);
    console.log("web3", web3zevm);

    const account = ethAccount;
    let p = await account.signTransaction({
        to: to,
        value: Web3.utils.toWei(amount),
        gas: "21000",
        gasPrice: "1000000000",
    });
    const div = document.getElementById("eth-transaction-receipt");
    div.appendChild(addDetails(`Signed Transaction  ${p.transactionHash}`, JSON.stringify(p, null, 2)));
    web3zevm.eth.sendSignedTransaction(p.rawTransaction).on('receipt', (x) => {
        div.appendChild(addDetails(`Transaction Receipt ${x.transactionHash}`, JSON.stringify(x, null, 2)));
        const a = document.createElement("a");
        a.href = `https://zetachain-athens-3.blockscout.com/tx/${x.transactionHash}`;
        a.innerText = "View receipt on Blockscout";
        a.target = "_blank";
        div.appendChild(a);
    });
});
console.log(RPCByChainID);

async function withdrawZRC20(zrc20) {
    const web3 = web3zevm;
    // validate address & amount
    const to = document.getElementById("input-eth-recipient").value;
    if (!Web3.utils.isAddress(to)) {
        alert("Invalid recipient address");
        return;
    }
    const amountInEther = document.getElementById("input-eth-amount").value;
    if (isNaN(amountInEther)) {
        alert("Invalid amount");
        return;
    }
    const amount = Web3.utils.toWei(amountInEther);


    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    const approval = await zrc20Contract.methods.allowance(ethAccount.address, zrc20).call();

    const div = document.getElementById("eth-transaction-receipt");
    if (approval < amount) {

        const p = await signApproveZRC20(zrc20, to, amount);
        const receipt = await web3zevm.eth.sendSignedTransaction(p.rawTransaction)
        console.log("approve receipt", receipt);
        div.appendChild(addDetails(`Approved ${amount} ZRC20 to ${to}`, JSON.stringify(receipt, null, 2)));
    } else {
        console.log(`already approved; allowance ${approval}`);
    }
    const p2 = await signWithdrawZRC20(zrc20, to, amount);
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        div.appendChild(addDetails(`Transaction Receipt ${x.transactionHash}`, JSON.stringify(x, null, 2)));
        const a = document.createElement("a");
        a.href = `https://zetachain-athens-3.blockscout.com/tx/${x.transactionHash}`;
        a.innerText = "View receipt on Blockscout";
        a.target = "_blank";
        div.appendChild(a);
    });
}

document.getElementById('button-withdraw-tbnb').addEventListener('click', async () => {
    const zrc20 = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891";
    await withdrawZRC20(zrc20);
});
document.getElementById('button-withdraw-geth').addEventListener('click', async () => {
    const zrc20 = "0x13A0c5930C028511Dc02665E7285134B6d11A5f4";
    await withdrawZRC20(zrc20);
});
document.getElementById('button-withdraw-tmatic').addEventListener('click', async () => {
    const zrc20 = "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb";
    await withdrawZRC20(zrc20);
});

document.getElementById('button-withdraw-tbtc').addEventListener('click', async () => {
    const web3 = web3zevm;
    // validate address & amount
    const toStr = document.getElementById("input-eth-recipient").value;
    const q = decode(toStr, "bech32");
    console.log("q", q);
    if (q === null) {
        alert("Invalid recipient address");
        return;
    }

    function asciiTo0x(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            let hex = str.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return "0x" + result;
    }

    const to = asciiTo0x(toStr);
    console.log("to", to);
    const amountInBtc = document.getElementById("input-eth-amount").value;
    if (isNaN(amountInBtc)) {
        alert("Invalid amount");
        return;
    }
    const amount = parseInt(amountInBtc * 1e8);
    console.log("amount", amount, "to", to);
    // return;

    const zrc20 = "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb";


    const div = document.getElementById("eth-transaction-receipt");
    const p = await signApproveZRC20(zrc20, to, amount + 10000000);
    const receipt = await web3zevm.eth.sendSignedTransaction(p.rawTransaction)
    console.log("approve receipt", receipt);
    div.appendChild(addDetails(`Approved ${amount} ZRC20 to ${to}`, JSON.stringify(receipt, null, 2)));

    const p2 = await signWithdrawZRC20(zrc20, to, amount);
    console.log("p2", p2);
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        div.appendChild(addDetails(`Transaction Receipt ${x.transactionHash}`, JSON.stringify(x, null, 2)));
        const a = document.createElement("a");
        a.href = `https://zetachain-athens-3.blockscout.com/tx/${x.transactionHash}`;
        a.innerText = "View receipt on Blockscout";
        a.target = "_blank";
        div.appendChild(a);
    });
});

async function signApproveZRC20(zrc20, recipient, amount) {
    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    const encodedABI = zrc20Contract.methods.approve(zrc20, "100000000000000000000000000").encodeABI();
    let p = await ethAccount.signTransaction({
        to: zrc20,
        value: "0",
        gas: "210000",
        data: encodedABI,
    });
    return p;
}

async function doZRC20Approve(zrc20, recipient, amount) {
    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    const encodedABI = zrc20Contract.methods.approve(recipient, amount).encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: zrc20,
        value: "0",
        gas: "210000",
        data: encodedABI,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}
window.doZRC20Approve = doZRC20Approve;


async function signWithdrawZRC20(zrc20, recipient, amount) {
    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    const encodedABIWithdraw = zrc20Contract.methods.withdraw(recipient, amount).encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: zrc20,
        value: "0",
        gas: "210000",
        data: encodedABIWithdraw,
    });
    return p2;
}

const WZETA = "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf";
const BTCZRC20 = "0x65a45c57636f9BcCeD4fe193A602008578BcA90b";

// bunch of functions to make trade on uniswap pools
async function getZRC20WZETAPair(zrc20) {

    const UNISWAPV2FACTORY = "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c";
    const factory = new web3zevm.eth.Contract(UNISWAPV2FACTORYABI, UNISWAPV2FACTORY);
    const pair = await factory.methods.getPair(zrc20, WZETA).call();
    return pair;
}
window.getZRC20WZETAPair = getZRC20WZETAPair;

async function getPair(tokenA, tokenB) {
    const UNISWAPV2FACTORY = "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c";
    const factory = new web3zevm.eth.Contract(UNISWAPV2FACTORYABI, UNISWAPV2FACTORY);
    const pair = await factory.methods.getPair(tokenA, tokenB).call();
    return pair;
}
window.getPair = getPair;

async function doCreatePair(tokenA, tokenB) {
    const UNISWAPV2FACTORY = "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c";
    const factory = new web3zevm.eth.Contract(UNISWAPV2FACTORYABI, UNISWAPV2FACTORY);
    const encodedABI = factory.methods.createPair(tokenA, tokenB).encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: UNISWAPV2FACTORY,
        value: "0",
        gas: "2800000",
        data: encodedABI,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}
window.doCreatePair = doCreatePair;

async function getReserves(pair) {
    const uniswapPair = new web3zevm.eth.Contract(UNISWAPV2PAIRABI, pair);
    const reserves = await uniswapPair.methods.getReserves().call();
    return reserves;
}
window.getReserves = getReserves;

async function amountOutSwapZetaForZrc20(zrc20, amount, reserves) {
    const UNISWAPV2ROUTER02 = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";
    const router02 = new web3zevm.eth.Contract(UNISWAPV2ROUTER02ABI, UNISWAPV2ROUTER02);
    if (reserves) {
        const amountOut = await router02.methods.getAmountOut(amount, reserves[0], reserves[1]).call();
        console.log("amountOut", amountOut);
    }
}
window.amountOutSwapZetaForZrc20 = amountOutSwapZetaForZrc20;

async function doSwapZetaForZrc20(zrc20, amount) {
    const UNISWAPV2ROUTER02 = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";
    const router02 = new web3zevm.eth.Contract(UNISWAPV2ROUTER02ABI, UNISWAPV2ROUTER02);
    const path = [WZETA, zrc20];
    const encodedABISwap = router02.methods.swapExactETHForTokens(0, path, ethAccount.address, "1234567890123456789").encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: UNISWAPV2ROUTER02,
        value: amount,
        gas: "2100000",
        data: encodedABISwap,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}
window.doSwapZetaForZrc20 = doSwapZetaForZrc20;

async function doSwapZrc20ForZeta(zrc20, amount) {
    const UNISWAPV2ROUTER02 = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";
    const router02 = new web3zevm.eth.Contract(UNISWAPV2ROUTER02ABI, UNISWAPV2ROUTER02);
    const path = [zrc20, WZETA];
    const encodedABISwap = router02.methods.swapExactTokensForETH(amount,0, path, ethAccount.address, "1234567890123456789").encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: UNISWAPV2ROUTER02,
        value: amount,
        gas: "2100000",
        data: encodedABISwap,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}


async function addLiquidityForZRC20(zrc20, amount, eth_value) {
    const UNISWAPV2ROUTER02 = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";
    const router02 = new web3zevm.eth.Contract(UNISWAPV2ROUTER02ABI, UNISWAPV2ROUTER02);
//     function addLiquidityETH(
//         address token,
//         uint amountTokenDesired,
//         uint amountTokenMin,
//         uint amountETHMin,
//         address to,
//         uint deadline
// ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    const encodedABIAddLiq = router02.methods.addLiquidityETH(
        zrc20,
        amount,
        amount,
        0,
        ethAccount.address,
        "1234567890123456789"
    ).encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: UNISWAPV2ROUTER02,
        value: eth_value,
        gas: "2100000",
        data: encodedABIAddLiq,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}
window.addLiquidityForZRC20 = addLiquidityForZRC20;

async function doAddLiquidityETH(token, amount_desired, amount_min, eth_value, eth_amount_min) {
    const UNISWAPV2ROUTER02 = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";
    const router02 = new web3zevm.eth.Contract(UNISWAPV2ROUTER02ABI, UNISWAPV2ROUTER02);
//     function addLiquidityETH(
//         address token,
//         uint amountTokenDesired,
//         uint amountTokenMin,
//         uint amountETHMin,
//         address to,
//         uint deadline
// ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    const encodedABIAddLiq = router02.methods.addLiquidityETH(
        token,
        amount_desired,
        amount_min,
        eth_amount_min,
        ethAccount.address,
        "1234567890123456789"
    ).encodeABI();
    let p2 = await ethAccount.signTransaction({
        to: UNISWAPV2ROUTER02,
        value: eth_value,
        gas: "2100000",
        data: encodedABIAddLiq,
    });
    web3zevm.eth.sendSignedTransaction(p2.rawTransaction).on('receipt', (x) => {
        console.log("receipt", x);
    });
}
window.doAddLiquidityETH = doAddLiquidityETH;

async function burnZRC20(zrc20, amount) {
    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    console.log("balance", await zrc20Contract.methods.balanceOf(ethAccount.address).call());
    // const encodedABI = zrc20Contract.methods.burn(amount).encodeABI();
    console.log("burning ", amount);
    const encodedABI = zrc20Contract.methods.burn(amount).encodeABI();
    let p = await ethAccount.signTransaction({
        to: zrc20,
        value: "0",
        gas: "210000",
        data: encodedABI,
    });
    const receipt = await web3zevm.eth.sendSignedTransaction(p.rawTransaction);
    console.log("burn receipt", receipt);
}

window.burnZRC20 = burnZRC20;

document.getElementById("mysterious-button").addEventListener("click", (async () => {
    window.getZRC20WZETAPair = getZRC20WZETAPair;
    const pair = await getZRC20WZETAPair(BTCZRC20);
    const reserves = await getReserves(pair);
    console.log("reserves", reserves);
    await amountOutSwapZetaForZrc20(BTCZRC20, "1000000000000000000", reserves);
    await doSwapZetaForZrc20(BTCZRC20, "1000000000000000000", pair);
}));


document.getElementById("button-send-tbtc").addEventListener("click", (async () => {
    const zrc20 = "0x65a45c57636f9BcCeD4fe193A602008578BcA90b";
    const to = document.getElementById("input-eth-recipient").value;
    console.log("to", to);
    if (!Web3.utils.isAddress(to)) {
        alert("Invalid recipient address");
        return;
    }
    const amountInBTC = document.getElementById("input-eth-amount").value;
    if (isNaN(amountInBTC)) {
        alert("Invalid amount");
        return;
    }
    const amountInSats = parseInt(amountInBTC * 1e8);

    const div = document.getElementById("eth-transaction-receipt");
    const p = await transferZRC20(zrc20, to, amountInSats);
    const receipt = await web3zevm.eth.sendSignedTransaction(p.rawTransaction)
    console.log("approve receipt", receipt);
    div.appendChild(addDetails(`Transferred ${amountInBTC} ZRC20 to ${to}`, JSON.stringify(receipt, null, 2)));
    const a = document.createElement("a");
    a.href = `https://zetachain-athens-3.blockscout.com/tx/${receipt.transactionHash}`;
    a.innerText = "View receipt on Blockscout";
    a.target = "_blank";
    div.appendChild(a);

}));

async function transferZRC20(zrc20, to, amount) {
    const zrc20Contract = new web3zevm.eth.Contract(ZRC20ABI, zrc20);
    const encodedABI = zrc20Contract.methods.transfer(to, amount).encodeABI();
    let p = await ethAccount.signTransaction({
        to: zrc20,
        value: "0",
        gas: "210000",
        data: encodedABI,
    });
    return p;
}


function stringToAsciiHex(str) {
    let hexString = '';
    for (let i = 0; i < str.length; i++) {
        let hexChar = str.charCodeAt(i).toString(16);
        hexString += hexChar;
    }
    return hexString;
}
window.stringToAsciiHex = stringToAsciiHex;