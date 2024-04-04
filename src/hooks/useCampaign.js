import { useEffect, useState } from "react";
import useCampaignCount from "./useCampaignCount";
import { useConnection } from "../context/connection";
import { getCrowdfundContract, getCrowdfundContractWithProvider } from "../utils";

const useCampaign = (id) => {
    const [campaign, setCampaign] = useState(null);
    const [state, setState] = useState("LOADING");
    const { provider } = useConnection();
    const campaignLength = useCampaignCount();
    const [contributorCount, setContributorCount] = useState(0);

    useEffect(() => {
        const fetchCampaign = async () => {
            const campaignId = Number(id);
            if (!campaignLength) return;
            if (!campaignId || campaignId > campaignLength)
                return setState("NOT_FOUND");
            try {
                const contract = await getCrowdfundContract(provider, false);

                const campaignStruct = await contract.crowd(campaignId);
                const contributors = Array.from(await contract.getContributors(campaignId));
                console.log(contributors);
                console.log("Get contributors");
                setContributorCount(contributors.length);
                console.log(contributorCount);

                const campaignDetails = {
                    id: campaignId,
                    title: campaignStruct.title,
                    fundingGoal: campaignStruct.fundingGoal,
                    owner: campaignStruct.owner,
                    durationTime: Number(campaignStruct.durationTime),
                    isActive: campaignStruct.isActive,
                    fundingBalance: campaignStruct.fundingBalance,
                    contributors: contributors,
                };

                setCampaign(campaignDetails);
                setState("LOADED");
            } catch (error) {
                console.error("Error fetching campaigns:", error);
                setState("NOT_FOUND");
            }
        };

        fetchCampaign();

    }, [campaignLength, id, provider]);


    useEffect(() => {
        const handleContributeEthEvent = async (id) => {
            const contributors = await contract.getContributors(id);
            console.log(contributors);
            const latestCampaign = {
                id: campaign.id,
                title: campaign.title,
                fundingGoal: campaign.fundingGoal,
                owner: campaign.owner,
                durationTime: Number(campaign.durationTime),
                isActive: campaign.isActive,
                fundingBalance: campaign.fundingBalance,
                contributors: contributors,
            }
            setCampaign(latestCampaign);
        }
        const contract = getCrowdfundContractWithProvider(provider);
        contract.on("ContributeEth", handleContributeEthEvent);

        return () => {
            contract.off("ContributeEth", handleContributeEthEvent);
        };
    }, [campaign]);


    return { campaign, state };
};

export default useCampaign;
