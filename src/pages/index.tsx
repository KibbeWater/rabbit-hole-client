import { Inter } from 'next/font/google';
import { useCallback, useEffect, useState } from 'react';
import MicrophoneIcon from '~/components/icons/MicrophoneIcon';
import PlusIcon from '~/components/icons/PlusIcon';
import { useRabbitHole } from '~/components/rabbithole';
import { useVoiceRecorder } from '~/components/voicerecorder';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
	const [logs, setLogs] = useState<string[]>([]);
	const [message, setMessage] = useState<string>('');
	const [image, setImage] = useState<string>('');

	const [url, setUrl] = useState<string>('');
	const [editingUrl, setEditingUrl] = useState<boolean>(true);

	const [accountKey, setAccountKey] = useState<string>('');
	const [imei, setImei] = useState<string>('');
	const [editingCredentials, setEditingCredentials] = useState<boolean>(true);

	useEffect(() => {
		const _imei = window.localStorage.getItem('imei');
		const _accountKey = window.localStorage.getItem('accountKey');
		const _url = window.localStorage.getItem('websocketUrl');
		setImei(_imei ?? '');
		setAccountKey(_accountKey ?? '');
		setUrl(_url ?? '');

		if (_imei && _accountKey) setEditingCredentials(false);
	}, []);

	useEffect(() => {
		if (editingCredentials) return;
		window.localStorage.setItem('imei', imei);
		window.localStorage.setItem('accountKey', accountKey);
	}, [editingCredentials, imei, accountKey]);

	useEffect(() => {
		if (editingUrl) return;
		window.localStorage.setItem('websocketUrl', url);
	}, [editingUrl, url]);

	const onRegister = useCallback((imei: string, accountKey: string, data: string) => {
		setImei(imei);
		setAccountKey(accountKey);
		setEditingCredentials(false);
		localStorage.setItem('imei', imei);
		localStorage.setItem('accountKey', accountKey);

		localStorage.setItem('registerData', data);
	}, []);

	const {
		logs: _logs,
		messages,
		sendMessage,
		sendAudio: _sendAudio,
		sendPTT,
		register,
		canAuthenticate,
		authenticated,
	} = useRabbitHole({
		accountKey: editingCredentials ? '' : accountKey,
		imei: editingCredentials ? '' : imei,
		url: editingUrl ? '' : url,
		onRegister,
	});

	const {
		isSupported,
		startRecording: _startRecording,
		stopRecording: _stopRecording,
		recording,
	} = useVoiceRecorder({
		onData: (data) => {
			console.log('Sending audio', data);
			_sendAudio(data);
		},
		sampleRate: 100,
	});

	const prompQR = () => {
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
	};

	const uploadAudio = () => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'audio/wav';
		fileInput.multiple = false;
		fileInput.addEventListener('change', () => {
			const file = fileInput.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (!result) return;
				const blob = new Blob([file], { type: 'audio/wav; codecs=0' });
				sendPTT(true, '');
				_sendAudio(blob);
				setTimeout(() => {
					sendPTT(false, image);
					setImage('');
				}, 500);
			};
			reader.readAsDataURL(file);
		});

		fileInput.click();
	};

	const uploadImage = () => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/jpeg';
		fileInput.multiple = false;
		fileInput.addEventListener('change', () => {
			const file = fileInput.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (!result) return;
				const b64 = result.toString().split(',')[1];
				setImage('data:image/jpeg;base64,' + b64);
			};
			reader.readAsDataURL(file);
		});

		fileInput.click();
	};

	const startRecording = () => {
		_startRecording();
		sendPTT(true, '');
		console.log('Recording started');
	};

	const stopRecording = () => {
		_stopRecording();
		setTimeout(() => {
			sendPTT(false, image);
			setImage('');
			console.log('Recording stopped');
		}, 1000);
	};

	return (
		<main
			className={`flex h-screen max-h-screen w-full flex-col gap-8 items-center lg:px-24 sm:px-12 px-4 py-8 overflow-hidden ${inter.className}`}
		>
			<div className='flex flex-col grow w-full h-full gap-4 overflow-hidden'>
				<div className='w-full py-2 flex-none flex flex-col-reverse md:flex-row md:gap-8 gap-2'>
					<div className='flex flex-none gap-2'>
						<input
							type='text'
							placeholder='Websocket URL'
							className='w-46 bg-neutral-700 py-1 px-3 rounded-lg text-white disabled:bg-neutral-600 disabled:text-neutral-400'
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							disabled={!editingUrl}
						/>
						<button
							className='bg-primary-500 text-white bg-neutral-600 hover:bg-neutral-700 transition-all py-1 px-3 rounded-lg'
							onClick={() => setEditingUrl((prev) => !prev)}
						>
							{editingUrl ? 'Connect' : 'Change'}
						</button>
					</div>
					<div className='lg:flex hidden flex-none gap-2'>
						<input
							type={editingCredentials ? 'text' : 'password'}
							placeholder='IMEI'
							className='w-46 bg-neutral-700 py-1 px-3 rounded-lg text-white disabled:bg-neutral-600 disabled:text-neutral-400'
							value={imei}
							onChange={(e) => setImei(e.target.value)}
							disabled={!editingCredentials}
						/>
						<input
							type={editingCredentials ? 'text' : 'password'}
							placeholder='Account Key'
							className='w-46 bg-neutral-700 py-1 px-3 rounded-lg text-white disabled:bg-neutral-600 disabled:text-neutral-400'
							value={accountKey}
							onChange={(e) => setAccountKey(e.target.value)}
							disabled={!editingCredentials}
						/>
						<button
							className='bg-primary-500 text-white bg-neutral-600 hover:bg-neutral-700 transition-all py-1 px-3 rounded-lg'
							onClick={() => setEditingCredentials((prev) => !prev)}
						>
							{editingCredentials ? 'Appy' : 'Change'}
						</button>
					</div>
					<div className='flex gap-2 md:justify-end grow'>
						<button
							className='bg-primary-500 text-white bg-neutral-600 hover:bg-neutral-700 transition-all py-1 px-3 rounded-lg disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed'
							onClick={() => {
								prompQR();
							}}
							disabled={!canAuthenticate || authenticated}
						>
							Register with QR
						</button>
					</div>
				</div>
				<div className='flex flex-col grow w-full h-full bg-neutral-700 rounded-lg overflow-x-hidden'>
					<div className='text-white flex flex-col-reverse gap-2 min-h-10 flex-grow flex-shrink w-full h-full px-6 py-2 overflow-y-auto'>
						{/* {_logs.map((log, index) => (
							<p key={index} className='text-sm text-wrap'>
								{log}
							</p>
						))} */}
						{messages.map((msg) => {
							switch (msg.type) {
								case 'user':
									return (
										<div
											key={msg.id}
											className={[
												'self-end rounded-t-lg rounded-bl-lg p-2 bg-neutral-500 lg:max-w-[49%] md:max-w-[65%]',
											].join(' ')}
										>
											{msg.dataType === 'text' ? (
												<p className='text-white px-2 py-1'>{msg.data}</p>
											) : msg.dataType === 'image' ? (
												// Since the image is base64 encoded, we can use it directly as the src attribute
												// eslint-disable-next-line @next/next/no-img-element
												<img src={msg.data} alt='User Image' className='rounded-lg max-h-[200px] h-full' />
											) : (
												<div className='flex flex-col px-2 py-1'>
													<p className='w-full text-xs text-neutral-400'>Sent using speech recognition</p>
													<p>{msg.data}</p>
												</div>
											)}
										</div>
									);
								case 'rabbit':
									return (
										<div
											key={msg.id}
											className={[
												'self-start rounded-t-lg rounded-br-lg px-4 py-3 bg-red-500 lg:max-w-[49%] md:max-w-[65%]',
											].join(' ')}
										>
											<p className='text-white'>{msg.data}</p>
										</div>
									);
								case 'system':
									return (
										<div
											key={msg.id}
											className={['self-center rounded-lg px-4 py-1 bg-neutral-600 w-min whitespace-nowrap'].join(
												' '
											)}
										>
											<p className='text-white'>{msg.data}</p>
										</div>
									);
								default:
									break;
							}
						})}
					</div>
				</div>
			</div>
			<div className='grow-0 flex-none flex flex-col'>
				{/* <p>Images: {image !== '' ? 'none' : undefined}</p> */}

				<form className='flex gap-4 whitespace-nowrap'>
					<div className='flex gap-2'>
						<label
							className='text-white p-1 bg-neutral-600 hover:bg-neutral-700 transition-all rounded-md disabled:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-700'
							onClick={(e) => {
								e.preventDefault();
								if (image === '') uploadImage();
								else setImage('');
							}}
						>
							<div className={['transition-all', image !== '' ? 'rotate-45' : ''].join(' ')}>
								<PlusIcon />
							</div>
						</label>
						<label
							className='text-white p-1 bg-neutral-600 hover:bg-neutral-700 transition-all rounded-md'
							onClick={(e) => {
								e.preventDefault();
								uploadAudio();
							}}
						>
							<MicrophoneIcon />
						</label>
						{/* TODO: Properly implement the ability to record voice messages */}
						{/* <label
							className={[
								'p-1 bg-neutral-600 hover:bg-neutral-700 transition-all rounded-md',
								recording ? 'text-red-800' : 'text-red-500',
							].join(' ')}
							onClick={(e) => {
								e.preventDefault();
								if (!isSupported()) return alert('Audio recording is not supported on this device');

								if (!recording) startRecording();
								else stopRecording();
							}}
						>
							<MicrophoneIcon />
						</label> */}
						<input
							type='text'
							className='w-full bg-neutral-700 py-1 px-3 rounded-md text-white'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
					</div>
					<button
						type='submit'
						className='bg-primary-500 text-white bg-neutral-600 py-1 px-3 rounded-md'
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
