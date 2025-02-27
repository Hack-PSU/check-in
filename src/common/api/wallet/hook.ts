import { useMutation } from "@tanstack/react-query";
import { createWalletPass } from "./provider";
import { WalletLinkResponse } from "./entity";

export function useCreateWalletPass() {
	return useMutation<WalletLinkResponse, Error, string>({
		mutationFn: (userId: string) => createWalletPass(userId),
	});
}
