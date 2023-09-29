import { useEffect, useState } from "react";
import useCampaignCount from "./useCampaignCount";
import { useConnection } from "../context/connection";
import {
    getCrowdfundContract,
    getCrowdfundContractWithProvider,
} from "../utils";
import useCampaign from "./useCampaign";

const useAllCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const { provider } = useConnection();
    const campaignNo = useCampaignCount();
    const { campaign } = useCampaign();

    useEffect(() => {
        const fetchAllCampaigns = async () => {
            try {
                const contract = await getCrowdfundContract(provider, false);
                const campaignsKeys = Array.from(
                    { length: Number(campaignNo) },
                    (_, i) => i + 1
                );
                const campaignPromises = campaignsKeys.map((id) =>
                    contract.crowd(id)
                );

                const campaignResults = await Promise.all(campaignPromises);

                const campaignDetails = campaignResults.map(
                    (details, index) => ({
                        id: campaignsKeys[index],
                        title: details.title,
                        fundingGoal: details.fundingGoal,
                        owner: details.owner,
                        durationTime: Number(details.durationTime),
                        isActive: details.isActive,
                        fundingBalance: details.fundingBalance,
                        contributors: details.contributors,
                    })
                );

                setCampaigns(campaignDetails);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            }
        };

        fetchAllCampaigns();

        // Listen for event
        const handleProposeCampaignEvent = async (id, title, amount, duration) => {
            const newCampaign = {
                id: Number(id),
                title: title,
                fundingGoal: amount,
                owner: null,
                durationTime: Number(duration),
                isActive: true,
                fundingBalance: 0,
                contributors: [],
            }

            // Fetch the proposed campaign
            // try {
            //     const newCampaign = await campaign(Number(id));
            //     console.log("Fetching new campaign");
            //     console.log(newCampaign);
            // } catch (err) {
            //     console.log(err);
            // }

            // Update the campaign list, LIFO
            setCampaigns(value => ([newCampaign, ...value]));
        };

        const contract = getCrowdfundContractWithProvider(provider);
        contract.on("ProposeCampaign", handleProposeCampaignEvent);

        return () => {
            contract.off("ProposeCampaign", handleProposeCampaignEvent);
        };
    }, [campaignNo, provider]);

    return campaigns;
};

export default useAllCampaigns;
