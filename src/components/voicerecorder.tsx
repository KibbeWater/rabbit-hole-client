import { useState, useEffect, useCallback } from 'react';

const mimeType = 'audio/webm';
export function useVoiceRecorder({ onData, sampleRate }: { onData: (data: Blob) => void; sampleRate: number }) {
	const [recording, setRecording] = useState<boolean>(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
	const [chunks, setChunks] = useState<Blob[]>([]);

	const startRecording = useCallback(async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const recorder = new MediaRecorder(stream, {
			mimeType,
			audioBitsPerSecond: 16000,
		});

		recorder.start(sampleRate);

		recorder.ondataavailable = (e) => {
			setChunks((prev) => [...prev, e.data]);
			onData(e.data);
		};

		setMediaRecorder(recorder);
		setRecording(true);

		return () => {
			setRecording(false);
			stream.getTracks().forEach((track) => track.stop());
		};
	}, [sampleRate, onData]);

	const stopRecording = useCallback(() => {
		if (mediaRecorder) {
			mediaRecorder.stop();
			const blob = new Blob(chunks, { type: 'audio/wav; codecs=0' });
			onData(blob);
			setChunks([]);
			setRecording(false);
		}
	}, [mediaRecorder, chunks, onData]);

	const isSupported = (): boolean => {
		return MediaRecorder.isTypeSupported(mimeType);
	};

	return { recording, startRecording, stopRecording, isSupported };
}
