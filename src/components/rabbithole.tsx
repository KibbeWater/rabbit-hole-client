import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTTS } from './tts';

export function useRabbitHole({
	accountKey,
	imei,
	onRegister,
}: {
	accountKey?: string;
	imei?: string;
	onRegister?: (imei: string, accountKey: string, data: string) => void;
}) {
	const [logs, setLogs] = useState<string[]>([]);
	const [authenticated, setAuthenticated] = useState<boolean>(false);
	const [canAuthenticate, setCanAuthenticate] = useState<boolean>(false);

	const { speak } = useTTS();

	const WS = useMemo(() => {
		const newWS = new WebSocket('ws://localhost:8080');

		newWS.addEventListener('open', () => {
			setLogs((prevLogs) => [...prevLogs, 'Connected to Rabbithole']);
			setCanAuthenticate(true);
			console.log('Connected to Rabbithole');
		});

		newWS.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);

			switch (data.type) {
				case 'logon':
					if (data.data !== 'success') return setLogs((prevLogs) => [...prevLogs, 'Authentication failed']);

					setAuthenticated(true);
					setCanAuthenticate(false);
					setLogs((prevLogs) => [...prevLogs, 'Authenticated successfully']);

					break;
				case 'message':
					setLogs((prevLogs) => [...prevLogs, `${data.data}`]);
					break;
				case 'audio':
					const audioB64 = data.data.audio;
					speak(audioB64);
					break;
				case 'register':
					const { imei, accountKey } = data.data;
					const responseData = JSON.stringify(data.data);
					onRegister?.(imei, accountKey, responseData);
					setLogs((prevLogs) => [...prevLogs, `Registered with data: ${responseData}`]);
					break;
				default:
					break;
			}
		});

		newWS.addEventListener('close', () => {
			setLogs((prevLogs) => [...prevLogs, 'Disconnected from Rabbithole']);
		});

		newWS.addEventListener('error', (error) => {
			setLogs((prevLogs) => [...prevLogs, `Error: ${JSON.stringify(error)}`]);
		});

		return newWS;
	}, [speak, onRegister]);

	useEffect(() => {
		if (!canAuthenticate || authenticated) return;

		const payload = JSON.stringify({ type: 'logon', data: { imei, accountKey } });
		// setLogs((prevLogs) => [...prevLogs, `Authenticating with payload: ${payload}`]);
		WS.send(payload);
	}, [accountKey, imei, WS, canAuthenticate, authenticated]);

	const sendMessage = useCallback(
		(message: string) => {
			if (!authenticated) return;
			const payload = JSON.stringify({ type: 'message', data: message });
			setLogs((prevLogs) => [...prevLogs, `Sending message: ${payload}`]);
			WS.send(payload);
		},
		[authenticated, WS]
	);

	const sendPTT = useCallback(
		(ptt: boolean, image: string) => {
			if (!authenticated) return;
			const payload = JSON.stringify({ type: 'ptt', data: { ptt, image } });
			setLogs((prevLogs) => [...prevLogs, `Sending PTT: ${payload}`]);
			WS.send(payload);
		},
		[authenticated, WS]
	);

	const sendAudio = useCallback(
		(audio: Blob) => {
			if (!authenticated) return;
			// We need to send the a b64 encoded string of the audio
			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (!result) return;
				const b64 = result.toString().split(',')[1];
				const payload = JSON.stringify({ type: 'audio', data: b64 });
				setLogs((prevLogs) => [...prevLogs, `Sending audio: ${payload}`]);
				WS.send(payload);
			};
			reader.readAsDataURL(audio);
		},
		[authenticated, WS]
	);

	const register = useCallback(
		(qrcodeData: string) => {
			console.log('Registering: ', canAuthenticate, authenticated);
			if (!canAuthenticate || authenticated) return;
			const payload = JSON.stringify({ type: 'register', data: qrcodeData });
			setLogs((prevLogs) => [...prevLogs, `Registering: ${payload}`]);
			WS.send(payload);
		},
		[WS, canAuthenticate, authenticated]
	);

	return { logs, canAuthenticate, authenticated, sendMessage, sendPTT, sendAudio, register };
}
