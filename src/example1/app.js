import express from 'express'
const app = express()

import https from 'httpolyglot'
import fs from 'fs'
import path from 'path'
const __dirname = path.resolve()

import { Server } from 'socket.io'
import mediasoup from 'mediasoup'


app.get('/',(req,res)=>{
    res.send('Hello from mediasoup app!')
})

app.use('/sfu', express.static(path.join(__dirname, 'public')))

const options = {
    key: fs.readFileSync('./server/ssl/key.pem', 'utf-8'),
    cert: fs.readFileSync('./server/ssl/cert.pem', 'utf-8')
}

const httpsServer = https.createServer(options,app)
httpsServer.listen(3000, ()=>{
    console.log('listening on port: '+ 3000 )
})

const io = new Server(httpsServer)

const peers = io.of('/mediasoup')


let worker
let router
let producerTransport
let producer
let consumerTransport
let consumer

const createWorker = async() => {
    worker = await mediasoup.createWorker({
        rtcMinPort: 2000,
        rtcMaxPort: 2020,
    })
    console.log(`worker pid ${worker.pid}`)
    worker.on('died', error => {
        console.error('mediasoup worker has died')
        setTimeout(()=>process.exit(1),2000)  //exit in 2 seconds
    
    })
    return worker
}

worker = createWorker()

const mediaCodecs = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000,
        },
    },

]

peers.on('connection', async socket => {
    console.log(socket.id)
    socket.emit('connection-success',{
         socketId : socket.id
         })

         socket.on('disconnect',() =>{
            // do some cleanup
            console.log('peer disconnected')
         })

    router = await worker.createRouter({ mediaCodecs, })

    socket.on('getRtpCapabilities', (callback) => {
        const rtpCapabilities = router.rtpCapabilities
        console.log('rtp Capabilities', rtpCapabilities)

        callback({ rtpCapabilities })
    })

    socket.on('createWebRtcTransport', async({ sender }, callback) =>{
        console.log(`Is this a sender request? ${sender}`)
        if(sender)
            producerTransport = await createWebRtcTransport(callback)
        else
        consumerTransport = await createWebRtcTransport(callback)
    })
    socket.on('transport-connect', async({ dtlsParameters },callback) =>{
        console.log('DTLS PARAMS... ', {dtlsParameters })
        await producerTransport.connect({ dtlsParameters })
    })
    socket.on('transport-produce',async({ kind, rtpParameters, appData }, callback) =>{
        producer = await producerTransport.produce({
            kind,
            rtpParameters,
        })

        console.log('Producer Id: ', producer.id, producer.kind)


        producer.on('transportclose', ()=>{
            console.log('transport for this producer closed')
            ProduceRequest.close()
        })

        callback({
            id: producer.id
        })
    })
})

socket.on('transport-recv-connect', async({ dtlsParameters })=> {
    
})

const createWebRtcTransport = async (callback) => {
    try {
        const webRtcTrnsport_options = {
            listenIps:[
                {
                    ip: '127.0.0.1'
                }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        }
        let transport = await router.createWebRtcTransport(webRtcTrnsport_options)
        transport.on('dtlsstatechange', dtlsState => {
            if (dtlsState === 'closed') {
                transport.close()
            }
        })

    transport.on('close', ()=> {
        console.log('transport closed')
    })
    callback({
        params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        }
    })

    return transport

    }catch (error) {
        console.log(error)
        callback({
            params: {
                error: error 
            }
        })
    }
}