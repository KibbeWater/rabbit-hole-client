# RabbitHole Client

This is a client for the [RabbitServer GO](https://firmburrow.rabbitu.de/Snow/rabbitserver-go) project to give a user-friendly interface to the server.

## Installation

This projects builds using [Bun](https://bun.sh/), however you can also use regular node.js and npm. To install the project, run the following commands:

```bash
git clone https://firmburrow.rabbitu.de/Snow/rabbitserver-go
cd rabbitserver-go
```

Install and run the server using the following commands:

```bash
bun install
bun run compile

# OR

npm install
npm run compile
```

The project will then build and then start up the server, which you can access at `http://localhost:3000`.

## Usage

The client relies you having a rabbitserver-go instance running. Put in the URL of the server in the input field and press connect. You can then either manually enter a IMEI and accountKey, or scan the QR code found in the [RabbitHole](https://hole.rabbit.tech/activate).

Once details are entered you should see a `Connected to Rabbithole` message in the event log. You are now free to use the client as you wish.

NOTE: You are currently unable to use voice commands, you can use .wav files of recorder speech to send commands however. Sending images is also only supported through the voice command system.
