import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import { Container, Form } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Player from "./Player";
import axios from "axios";

const spotifyApi = new SpotifyWebApi({
	clientId: "441bca7af371439ca25719b57bef08b8",
});

export default function Dashboard({ code }) {
	const accessToken = useAuth(code);
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [playingTrack, setPlayingTrack] = useState();
	const [lyrics, setLyrics] = useState("");

	function chooseTrack(track) {
		setPlayingTrack(track);
		setSearch("");
		setSearch("");
	}

	//Effect for retrieving track lyrics via node server API
	useEffect(() => {
		if (!playingTrack) return;
		axios
			.get("http://localhost:3001/lyrics", {
				params: {
					track: playingTrack.title,
					artist: playingTrack.artist,
				},
			})
			.then((res) => {
				setLyrics(res.data.lyrics);
			});
	}, [playingTrack]);

	useEffect(() => {
		if (!accessToken) return;
		spotifyApi.setAccessToken(accessToken);
	}, [accessToken]);

	//Effect for retrieving search results and images of tracks
	useEffect(() => {
		if (!search) return setSearchResults([]);
		if (!accessToken) return;

		let cancel = false;
		spotifyApi.searchTracks(search).then((res) => {
			if (cancel) return;
			setSearchResults(
				res.body.tracks.items.map((track) => {
					//find smallest image in track object
					const smallestAlbumImage = track.album.images.reduce(
						(smallest, image) => {
							if (image.height < smallest.height) return image;
							return smallest;
						},
						track.album.images[0]
					);
					return {
						artist: track.artists[0].name,
						title: track.name,
						uri: track.uri,
						albumUrl: smallestAlbumImage.url,
					};
				})
			);
		});
		//cancels previous search request if new search request is made
		return () => (cancel = true);
	}, [search, accessToken]);

	return (
		<Container className='d-flex flex-column py-2' style={{ height: "100vh" }}>
			<Form.Control
				type='search'
				placeholder='Search Songs/Artists'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<div className='flex-grow-1 my-2' style={{ overflowY: "auto" }}>
				{searchResults.map((track) => (
					<TrackSearchResult
						track={track}
						key={track.uri}
						chooseTrack={chooseTrack}
					/>
				))}
			</div>
			{searchResults.length === 0 && (
				<div className='text-center' style={{ whiteSpace: "pre" }}>
					{lyrics}
				</div>
			)}
			<div>
				<Player accessToken={accessToken} trackUri={playingTrack?.uri} />
			</div>
		</Container>
	);
}
