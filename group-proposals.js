import {
    AddressExplorerByChainID,
    bitcoinChainID,
    esploraAPIURL,
    evmURL,
    nodeURL,
    groupAdminAddresses,
    RPCByChainID,
    externalChainIDs,
    makeTableElement2, makeTableElement, renderHeader
} from './common.js';
import './web3.min.js';
import {convertbits, decode, encode} from "./bech32.js";

await renderHeader();

async function fetchProposalsByGroupAdminAddresses() {
    const allProposals = [];

    for (const [adminName, groupPolicyAddress] of Object.entries(groupAdminAddresses)) {
        try {
            const response = await fetch(`${nodeURL}/cosmos/group/v1/proposals_by_group_policy/${groupPolicyAddress}`);
            const data = await response.json();
            console.log(`Proposals for ${adminName}:`, data.proposals);

            // Attach group name and address to each proposal
            for (const proposal of data.proposals) {
                proposal.groupName = adminName;
                proposal.groupAddress = groupPolicyAddress;

                // Fetch proposal details
                const detailsResponse = await fetch(`${nodeURL}/cosmos/group/v1/proposal/${proposal.id}`);
                const detailsData = await detailsResponse.json();
                proposal.details = detailsData.proposal;
            }

            allProposals.push(...data.proposals);
        } catch (error) {
            console.error(`Error fetching proposals for ${adminName}:`, error);
        }
    }

    displayProposals(allProposals);
}

function displayProposals(proposals) {
    const proposalsList = document.getElementById('proposals-list');
    if (proposals.length === 0) {
        proposalsList.innerText = 'No open proposals found.';
        return;
    }
    proposals.forEach(proposal => {
        const proposalItem = document.createElement('div');
        proposalItem.innerHTML = `
            <strong>Group Name:</strong> ${proposal.groupName} <br />
            <strong>Group Address:</strong> ${proposal.groupAddress} <br />
            <strong>Proposal ID:</strong> ${proposal.id} <br />
            <strong>Status:</strong> ${proposal.status} <br />
            <strong>Title:</strong> ${proposal.details.title} <br />
            <strong>Summary:</strong> ${proposal.details.summary} <br />
            <strong>Final Tally Result:</strong> Yes: ${proposal.details.final_tally_result.yes_count}, No: ${proposal.details.final_tally_result.no_count}, Abstain: ${proposal.details.final_tally_result.abstain_count}, No with Veto: ${proposal.details.final_tally_result.no_with_veto_count} <br />
            <strong>Messages:</strong> ${proposal.details.messages.map(msg => JSON.stringify(msg)).join(', ')}
            <br /> <br />
        `;
        proposalsList.appendChild(proposalItem);
    });
}

fetchProposalsByGroupAdminAddresses();