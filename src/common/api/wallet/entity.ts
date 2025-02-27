export interface HackathonPassData {
	eventName: string;
	issuerName: string;
	homepageUri: string;
	logoUrl: string;
	ticketHolderName: string;
	ticketNumber: string;
	startDateTime: string;
	endDateTime: string;
	location: {
		latitude: number;
		longitude: number;
	};
}

export interface WalletLinkResponse {
	walletLink: string;
}
