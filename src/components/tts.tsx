import { useCallback, useEffect, useState } from 'react';

export function useTTS() {
	const [queue, setQueue] = useState<string[]>([]);
	const [speaking, setSpeaking] = useState<boolean>(false);

	const speak = useCallback((text: string) => {
		console.log('Saying:', text);
		setQueue((prev) => [...prev, text]);
	}, []);

	const playAudio = useCallback(async (b64: string) => {
		const audio = new Audio(`data:audio/wav;base64,${b64}`);
		audio.onended = () => {
			setQueue((prev) => prev.slice(1));
			setTimeout(() => {
				setSpeaking(false);
			}, 200);
		};
		await audio.play();
	}, []);

	useEffect(() => {
		if (speaking || queue.length === 0) return;

		console.log('Speaking:', queue[0]);

		const text = queue[0];
		setSpeaking(true);
		playAudio(text);
	}, [speaking, queue, playAudio]);

	return { speak };
}
