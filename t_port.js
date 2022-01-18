let ports = {
	express_port: 8080,
	local_socket_port: 8019,
};

if (process.env.IN_WORKS !== undefined) {
	ports = {
		express_port: 3922,
		// express_port: 3015,
		local_socket_port: 8019,
	};
}

module.exports = ports;