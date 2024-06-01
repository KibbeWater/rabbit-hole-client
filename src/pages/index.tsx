import { Inter } from 'next/font/google';
import { useCallback, useEffect, useState } from 'react';
import { useRabbitHole } from '~/components/rabbithole';
import { useVoiceRecorder } from '~/components/voicerecorder';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
	const [message, setMessage] = useState<string>('');
	const [image, setImage] = useState<string>('');

	const [accountKey, setAccountKey] = useState<string | undefined>(undefined);
	const [imei, setImei] = useState<string | undefined>(undefined);

	useEffect(() => {
		setImei(window.localStorage.getItem('imei') ?? undefined);
		setAccountKey(window.localStorage.getItem('accountKey') ?? undefined);
	}, []);

	const onRegister = useCallback((imei: string, accountKey: string, data: string) => {
		setImei(imei);
		setAccountKey(accountKey);
		localStorage.setItem('imei', imei);
		localStorage.setItem('accountKey', accountKey);

		localStorage.setItem('registerData', data);
	}, []);

	/* const { logs, sendMessage, sendAudio, sendPTT, register } = useRabbitHole({
		imei: '358476310092820',
		accountKey: 'ac2528efd95f943f215c94b184eca1df',
	}); */
	const { logs, sendMessage, sendAudio, sendPTT, register } = useRabbitHole({ accountKey, imei, onRegister });

	return (
		<main className={`flex min-h-screen w-full flex-col gap-8 items-center p-24 ${inter.className}`}>
			<h1 className='text-xl flex-none grow-0'>Event Log</h1>
			<div className='w-full bg-neutral-700 text-white flex flex-col gap-2 min-h-10 py-6 px-2 rounded-xl grow'>
				{logs.map((log, index) => (
					<p key={index} className='text-sm'>
						{log}
					</p>
				))}
			</div>
			<div className='grow-0 flex flex-col'>
				<p>Images: {image !== '' ? 'none' : undefined}</p>

				<form className='flex gap-4'>
					<label
						className='text-white'
						onClick={(e) => {
							e.preventDefault();
							console.log('Uploading image');

							const fileInput = document.createElement('input');
							fileInput.type = 'file';
							fileInput.accept = 'audio/wav';
							fileInput.multiple = false;
							fileInput.addEventListener('change', (event) => {
								const file = fileInput.files?.[0];
								if (!file) return;

								const reader = new FileReader();
								reader.onload = (event) => {
									const result = event.target?.result;
									if (!result) return;
									const b64 = result.toString().split(',')[1];
									const blob = new Blob([file], { type: 'audio/wav; codecs=0' });
									console.log('Sending image:', b64);
									sendPTT(true, '');
									sendAudio(blob);
									setTimeout(() => {
										sendPTT(false, '');
									}, 3000);
								};
								reader.readAsDataURL(file);
							});

							fileInput.click();
						}}
					>
						Upload Image
						<input type='file' className='hidden' />
					</label>
					<label
						className='text-white'
						onClick={(e) => {
							e.preventDefault();
							console.log('Registering');

							const fileInput = document.createElement('input');
							fileInput.type = 'file';
							fileInput.accept = 'image/png';
							fileInput.multiple = false;
							fileInput.addEventListener('change', (event) => {
								const file = fileInput.files?.[0];
								if (!file) return;

								const reader = new FileReader();
								reader.onload = (event) => {
									const result = event.target?.result;
									if (!result) return;
									const b64 = result.toString().split(',')[1];
									register(b64);
								};
								reader.readAsDataURL(file);
							});

							fileInput.click();
						}}
					>
						Register
						<input type='file' className='hidden' />
					</label>
					<input
						type='text'
						className='w-full bg-neutral-700 py-1 px-3 rounded-xl text-white'
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<button
						type='submit'
						className='bg-primary-500 text-white bg-neutral-600 py-1 px-3 rounded-xl'
						onClick={(e) => {
							e.preventDefault();
							console.log('Sending message:', message);
							setMessage('');
							sendMessage(message);
						}}
					>
						Submit
					</button>
				</form>
			</div>
		</main>
	);
}
