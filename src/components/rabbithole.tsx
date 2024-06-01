import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTTS } from './tts';

export function useRabbitHole({
	accountKey,
	imei,
	onRegister,
	url,
}: {
	accountKey?: string;
	imei?: string;
	onRegister?: (imei: string, accountKey: string, data: string) => void;
	url: string;
}) {
	const [logs, setLogs] = useState<string[]>([]);
	const [authenticated, setAuthenticated] = useState<boolean>(false);
	const [canAuthenticate, setCanAuthenticate] = useState<boolean>(false);

	const WS = useRef<WebSocket | null>(null);

	const { speak } = useTTS();

	useEffect(() => {
		if (!url || url === '') return;
		console.log('Building new websocket');

		const newWS = new WebSocket(url);
		WS.current = newWS;

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
			setCanAuthenticate(false);
			setAuthenticated(false);
		});

		newWS.addEventListener('error', (error) => {
			setLogs((prevLogs) => [...prevLogs, `Error: ${JSON.stringify(error)}`]);
		});

		return () => {
			newWS.close();
			setCanAuthenticate(false);
			setAuthenticated(false);
		};
	}, [speak, onRegister, url]);

	useEffect(() => {
		if (!canAuthenticate || authenticated || !WS.current) return;

		if (accountKey === '' || imei === '') {
			setLogs((prevLogs) => [...prevLogs, 'Account key or IMEI not provided']);
			return;
		}

		const payload = JSON.stringify({ type: 'logon', data: { imei, accountKey } });
		setLogs((prevLogs) => [...prevLogs, `Authenticating with payload: ${payload}`]);
		WS.current.send(payload);
	}, [accountKey, imei, WS, canAuthenticate, authenticated]);

	const sendMessage = useCallback(
		(message: string) => {
			if (!authenticated || !WS.current) return;
			const payload = JSON.stringify({ type: 'message', data: message });
			setLogs((prevLogs) => [...prevLogs, `Sending message: ${payload}`]);
			WS.current.send(payload);
		},
		[authenticated, WS]
	);

	const sendPTT = useCallback(
		(ptt: boolean, image: string) => {
			if (!authenticated || !WS.current) return;
			const payload = JSON.stringify({ type: 'ptt', data: { active: ptt, image } });
			setLogs((prevLogs) => [...prevLogs, `Sending PTT with status ${ptt} ${image ? 'with an image' : 'without image'}`]);
			WS.current.send(payload);
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
				if (!result || !WS.current) return;

				if (typeof result === 'string' && result.startsWith('data:audio/wav')) {
					const payload = JSON.stringify({ type: 'audio', data: result.toString() });
					setLogs((prevLogs) => [...prevLogs, `Sending audio`]);
					WS.current.send(payload);
				}
			};
			reader.readAsDataURL(audio);
		},
		[authenticated, WS]
	);

	const register = useCallback(
		(qrcodeData: string) => {
			if (!canAuthenticate || authenticated || !WS.current) return;
			const payload = JSON.stringify({ type: 'register', data: qrcodeData });
			setLogs((prevLogs) => [...prevLogs, `Registering: ${payload}`]);
			WS.current.send(payload);
		},
		[WS, canAuthenticate, authenticated]
	);

	return { logs, canAuthenticate, authenticated, sendMessage, sendPTT, sendAudio, register };
}
