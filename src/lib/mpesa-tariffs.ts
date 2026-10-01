// Single source of truth for Safaricom M-Pesa tariffs.
// Imported by BOTH the /mpesa-fee-calculator page (browser) and api/chat.ts (edge).
// Bands match Safaricom's published 2026 tariff (verified September 2026).
// Send/STK/Paybill share one national banded tariff. Till is free to the customer.

export type MpesaTxType = "stk" | "paybill" | "till" | "p2p" | "withdraw";

export interface TariffBand {
	min: number;
	max: number;
	fee: number;
}

export const TARIFFS: Record<MpesaTxType, TariffBand[]> = {
	stk: [
		{ min: 1, max: 100, fee: 0 },
		{ min: 101, max: 500, fee: 7 },
		{ min: 501, max: 1000, fee: 13 },
		{ min: 1001, max: 1500, fee: 23 },
		{ min: 1501, max: 2500, fee: 33 },
		{ min: 2501, max: 3500, fee: 53 },
		{ min: 3501, max: 5000, fee: 57 },
		{ min: 5001, max: 7500, fee: 78 },
		{ min: 7501, max: 10000, fee: 90 },
		{ min: 10001, max: 15000, fee: 100 },
		{ min: 15001, max: 20000, fee: 105 },
		{ min: 20001, max: 250000, fee: 108 },
	],
	paybill: [
		{ min: 1, max: 100, fee: 0 },
		{ min: 101, max: 500, fee: 7 },
		{ min: 501, max: 1000, fee: 13 },
		{ min: 1001, max: 1500, fee: 23 },
		{ min: 1501, max: 2500, fee: 33 },
		{ min: 2501, max: 3500, fee: 53 },
		{ min: 3501, max: 5000, fee: 57 },
		{ min: 5001, max: 7500, fee: 78 },
		{ min: 7501, max: 10000, fee: 90 },
		{ min: 10001, max: 15000, fee: 100 },
		{ min: 15001, max: 20000, fee: 105 },
		{ min: 20001, max: 250000, fee: 108 },
	],
	till: [
		{ min: 1, max: 100, fee: 0 },
		{ min: 101, max: 500, fee: 0 },
		{ min: 501, max: 1000, fee: 0 },
		{ min: 1001, max: 1500, fee: 0 },
		{ min: 1501, max: 2500, fee: 0 },
		{ min: 2501, max: 3500, fee: 0 },
		{ min: 3501, max: 5000, fee: 0 },
		{ min: 5001, max: 7500, fee: 0 },
		{ min: 7501, max: 10000, fee: 0 },
		{ min: 10001, max: 15000, fee: 0 },
		{ min: 15001, max: 20000, fee: 0 },
		{ min: 20001, max: 250000, fee: 0 },
	],
	p2p: [
		{ min: 1, max: 100, fee: 0 },
		{ min: 101, max: 500, fee: 7 },
		{ min: 501, max: 1000, fee: 13 },
		{ min: 1001, max: 1500, fee: 23 },
		{ min: 1501, max: 2500, fee: 33 },
		{ min: 2501, max: 3500, fee: 53 },
		{ min: 3501, max: 5000, fee: 57 },
		{ min: 5001, max: 7500, fee: 78 },
		{ min: 7501, max: 10000, fee: 90 },
		{ min: 10001, max: 15000, fee: 100 },
		{ min: 15001, max: 20000, fee: 105 },
		{ min: 20001, max: 250000, fee: 108 },
	],
	withdraw: [
		{ min: 50, max: 100, fee: 11 },
		{ min: 101, max: 500, fee: 29 },
		{ min: 501, max: 1000, fee: 29 },
		{ min: 1001, max: 1500, fee: 29 },
		{ min: 1501, max: 2500, fee: 29 },
		{ min: 2501, max: 3500, fee: 52 },
		{ min: 3501, max: 5000, fee: 69 },
		{ min: 5001, max: 7500, fee: 87 },
		{ min: 7501, max: 10000, fee: 115 },
		{ min: 10001, max: 15000, fee: 167 },
		{ min: 15001, max: 20000, fee: 185 },
		{ min: 20001, max: 35000, fee: 197 },
		{ min: 35001, max: 50000, fee: 278 },
		{ min: 50001, max: 250000, fee: 309 },
	],
};

export function getFee(type: string, amount: number): number | null {
	const bands = (TARIFFS as Record<string, TariffBand[]>)[type];
	if (!bands || !Number.isFinite(amount)) return null;
	const band = bands.find((b) => amount >= b.min && amount <= b.max);
	return band ? band.fee : null;
}
