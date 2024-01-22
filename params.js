import {externalChainIDs, addDetails, nodeURL, RPCByChainID, corsProxyURL, hashServerURL} from './common.js';

(async () => {
    async function renderChainParams() {
        const div = document.getElementById('chain-params-json');
        const url = `${nodeURL}/zeta-chain/observer/get_chain_params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderChainParams();

    async function renderSlashingParams() {
        const div = document.getElementById('slashing-params-json');
        const url = `${nodeURL}/cosmos/slashing/v1beta1/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderSlashingParams();

    async function renderStakingParams() {
        const div = document.getElementById('staking-params-json');
        const url = `${nodeURL}/cosmos/staking/v1beta1/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
        console.log(element);
    }
    renderStakingParams();

    async function renderEmissionParams() {
        const div = document.getElementById('emission-params-json');
        const url = `${nodeURL}/zeta-chain/emissions/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderEmissionParams();

    async function renderGovParams() {
        async function render(subspace){
            const div = document.getElementById(`gov-params-json-${subspace}`);
            const url = `${nodeURL}/cosmos/gov/v1/params/${subspace}`;
            const response = await fetch(url);
            const data = await response.json();
            const element = createTreeView(div, data);
        }
        await render("deposit");
        await render("voting");
        await render("tallying");
    }
    renderGovParams();

    async function renderObserverParams() {
        const div = document.getElementById('observer-params-json');
        const url = `${nodeURL}/zeta-chain/observer/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderObserverParams();
})();
