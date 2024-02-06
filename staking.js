import {
    AddressExplorerByChainID,
    bitcoinChainID,
    esploraAPIURL,
    evmURL,
    nodeURL,
    RPCByChainID,
    externalChainIDs,
    makeTableElement2, makeTableElement, renderHeader
} from './common.js';
import './web3.min.js';
import {convertbits, decode, encode} from "./bech32.js";

await renderHeader();

class StakingPage {
    constructor() {
    }

    async initialize() {

    }

    async render() {
        const entry = document.getElementById("entry");
        entry.appendChild(H1("Distribution params"));
        const res2 = await fetch(`${nodeURL}/cosmos/distribution/v1beta1/params`);
        const data2 = await res2.json();
        console.log("data2", data2);
        entry.appendChild(makeTableElement(data2.params));

        entry.appendChild(H1("Staking Info"));
        const res = await fetch(`${nodeURL}/zeta-chain/emissions/list_addresses`);
        const addresses = await res.json();
        const rows = [];
        for (const name in addresses) {
            console.log(name, addresses[name]);
            const addr = addresses[name];
            // const res2 = await fetch(`${nodeURL}/cosmos/emissions/show_available_emissions/${addr}`);
            const res2 = await fetch(`${nodeURL}/cosmos/bank/v1beta1/balances/${addr}/by_denom?denom=azeta`);
            const amount = await res2.json();
            console.log("amount", amount);
            rows.push({
               name: name,
               address:  addr,
                amount: `${amount.balance.amount}`
            });
        }
        entry.appendChild(makeTableElement2(rows, ["name", "address", "amount"]));

        entry.appendChild(H1("Validator Voting Power"));
        const res3 = await fetch(`${nodeURL}/cosmos/staking/v1beta1/validators`);
        const data = await res3.json();
        console.log("data", data);
        const rows2 = [];
        let totalBondedTokens = 0;
        for (let i=0; i<data.validators.length; i++) {
            const val = data.validators[i];
            const d = decode(val.operator_address, "bech32");
            const a = convertbits(d.data, 5, 8, false);
            const valAddress = encode("zeta", convertbits(a, 8, 5, true), "bech32");
            const row = {
                "moniker": val.description.moniker,
                "address": valAddress,
                "jailed": val.jailed,
                "status": val.status,
                "tokens": parseFloat(val.tokens)/1e18,
                "delegator_share": parseFloat(val.delegator_shares)/parseFloat(val.tokens),
                "update_time": val.commission.update_time,
                "val_address": val.operator_address
            };
            rows2.push(row);
            console.log("val", i, row);
            if (val.status == 'BOND_STATUS_BONDED')
                totalBondedTokens += parseFloat(val.tokens);
        }
        rows2.sort((a,b)=>{return -a.tokens+b.tokens;});
        console.log(rows2);
        console.log("totalBondedTokens", totalBondedTokens);
        entry.appendChild(makeTableElement2(rows2, ["moniker", "address", "jailed", "status", "tokens", "delegator_share", "update_time","val_address"]));
    }
}


const page = new StakingPage();
await page.initialize();

await page.render();
