export const capitialize = (str) => {
	if (!str || typeof str !== "string") return "";

	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getNetworkQuality = () => {
	const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	const effectiveType = connection?.effectiveType || "unknown";
	const downlink = connection?.downlink || 0;
	const rtt = connection?.rtt || 0;

	if (effectiveType.includes("4g") && downlink >= 10 && rtt < 120) return "Excellent";
	if (effectiveType.includes("3g") || effectiveType.includes("4g") || downlink >= 4 || rtt < 220) return "Good";
	if (effectiveType.includes("2g") || rtt > 400 || downlink < 1) return "Poor";

	return "Fair";
};