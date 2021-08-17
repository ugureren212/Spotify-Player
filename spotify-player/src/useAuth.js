import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth(code) {
	const [accessToken, setAccessToken] = useState();
	const [refreshToken, setRefreshToken] = useState();
	const [expiresIn, setExpiresIn] = useState();

	useEffect(() => {
		axios
			.post("http://localhost:3001/login", { code })
			.then((res) => {
				setAccessToken(res.data.accessToken);
				setRefreshToken(res.data.refreshToken);
				setExpiresIn(res.data.expiresIn);
				//clear URL
				window.history.pushState({}, null, "/");
			})
			.catch((err) => {
				console.log(err);
				console.log(
					"Something went wrong so you are sent back to the login page"
				);
				window.location = "/";
			});
	}, [code]);

	//effect to refresh token every hour
	useEffect(() => {
		//prevent token refreshing before the login useEffect
		if (!refreshToken || !expiresIn) return;

		const interval = setInterval(() => {
			axios
				.post("http://localhost:3001/refresh", { refreshToken })
				.then((res) => {
					setAccessToken(res.data.accessToken);
					setExpiresIn(res.data.expiresIn);
					// window.history.pushState({}, null, "/")
				})
				.catch((err) => {
					console.log(err);
					console.log("Something went wrong with refreshing access token");
					window.location = "/";
				});
		}, (expiresIn - 60) * 1000);
		return () => clearInterval(interval);
	}, [refreshToken, expiresIn]);

	return accessToken;
}
